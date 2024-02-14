import { Airplane } from "./simulations/airplane";
import { Bullet } from "./simulations/bullet";
import { Missile } from "./simulations/missile";
import { Clock } from "./clock/clock";
import { LoginState } from "./ui/login";
import { Renderer } from "./renderer/renderer";
import { distance, sleep } from "./utils/utils";
import { Simulation } from "./simulations/simulation";

/* Desired internal loop frequency */
const FPS = 60;

/* User inputs interface */
export interface KeyboardInputs {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    gun: boolean,
    missile: boolean
}

export interface GamepadInputs {
    pitch: number | null,
    roll: number | null,
    thrust: number | null,
    gun: boolean | null
}

export class FightsOnCore {
    uuid: string = "";
    username: string = "";

    renderer: Renderer;
    ownship: Airplane;
    previousIntegrationTime: number = 0;
    pressedKeys: { [key: string]: boolean } = {};
    interval: number = 0;
    gamepadControls: {
        pitchControl: { id: string, axis: number } | null,
        rollControl: { id: string, axis: number } | null,
        thrustControl: { id: string, axis: number } | null,
        gunControl: { id: string, button: number } | null
    }

    /* Static members and methods */
    static #webSocket: WebSocket;
    static #clock: Clock;

    /** Send a message via the websocket
     * 
     * @param json Message to send
     */
    static sendMessage(json: any) {
        FightsOnCore.#webSocket.send(JSON.stringify(json));
    }

    static getClock() {
        return FightsOnCore.#clock;
    }
    
    constructor() {
        /* Connect to the websocket */
        FightsOnCore.#webSocket = new WebSocket(`ws://${document.location.hostname}:${Number(document.location.port) + 1}`); //TODO configurable

        /* Start the synchronized clock */
        FightsOnCore.#clock = new Clock();

        /* Define listeners */
        FightsOnCore.#webSocket.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data.toString())));
        FightsOnCore.#webSocket.addEventListener('close', (ev) => this.onClose(ev));

        /* Key events for inputs */
        document.addEventListener('keydown', (ev) => this.onKeyDown(ev));
        document.addEventListener('keyup', (ev) => this.onKeyUp(ev));

        /* Start the renderer on the canvas */
        let canvas = document.getElementById("canvas") as HTMLCanvasElement;
        if (canvas) 
            this.renderer = new Renderer(canvas as HTMLCanvasElement);
        else
            throw "Error retrieving canvas"

        /* Initialize the player airplane */
        this.ownship = new Airplane();

        /* Initialize the controls */
        this.gamepadControls = {
            pitchControl: null,
            rollControl: null, 
            thrustControl: null,
            gunControl: null
        }
    }

    /** Asynchronously starts the app
     * 
     */
    async start(loginState: LoginState) {
        /* Read the login state */
        this.username = loginState.username;
        this.gamepadControls = {
            pitchControl: loginState.pitchGamepad,
            rollControl: loginState.rollGamepad,
            thrustControl: loginState.thrustGamepad,
            gunControl: loginState.gunGamepad
        }

        /* Wait for the WebSocket to actually connect */
        this.waitForConnection().then(
            async () => {
                /* Send user data */
                let data = JSON.stringify({ id: "data", username: this.username });
                FightsOnCore.sendMessage(data);

                /* Perform the clock synchronization with the server */
                await this.synchronizeTime();

                /* Start the main loop */
                this.interval = window.setInterval(() => this.loop(), 1 / FPS * 1000);
            },
            (err) => {
                /* Probably a connection timeout */
                console.error(err);
            }
        )
    }

    /** Asynchronously waits for the websocket to connect. Will timeout after 1 second.
     * 
     */
    async waitForConnection() {
        let retries = 10;
        while (retries-- > 0) {
            if (FightsOnCore.#webSocket.readyState === FightsOnCore.#webSocket.OPEN) {
                return;
            }
            await sleep(100);
        }
        throw "Connection timeout";
    }

    /** Asynchronously perform the synchronization (yeah, I know...) process with the server.
     * 
     */
    async synchronizeTime() {
        console.log(`Starting time synchronization`)
        /* Send 10 synchronization messages to the server in order to try and average the lag delay */
        for (let i = 0; i < 10; i++) {
            let data = JSON.stringify({ id: "synchronization", time: Date.now() });
            FightsOnCore.sendMessage(data);
            await sleep(100);
        }
        console.log(`Estimated time delta: ${FightsOnCore.#clock.delta}ms`)
    }

    /** Message callback
     * 
     * @param json Message content
     */
    onMessage(json: any) {
        switch (json.id) {
            case "connection":
                this.onConnectionMessage(json);
                break;
            case "synchronization":
                this.onSynchronizationMessage(json);
                break;
            case "death":
                this.onDeathMessage(json);
                break;
            case "update":
                this.onUpdateMessage(json);
                break;
            case "remove":
                this.onRemoveMessage(json);
                break;
            default:
                break;
        }
    }

    /** Close callback. We probably just closed the app so bye bye :)
     * 
     * @param ev The close event
     */
    onClose(ev: Event) {
        console.log("Websocket disconnected")
    }

    /** On connection message callback.
     * 
     * @param json Message content
     */
    onConnectionMessage(json: any) {
        /* Set the uuid that the server assigned us */
        this.uuid = json.uuid;
        console.log(`Assigned uuid ${this.uuid}`);
    }

    /** Synchronization message callback
     * 
     * @param json Message content
     */
    onSynchronizationMessage(json: any) {
        /* Extract the server time and local original transmission time */
        let serverTime: number = json.time;
        let txTime: number = json.txTime;
        let rxTime: number = Date.now();

        /* The lag is half the time between the local transmission and local reception times */
        let delay = (rxTime - txTime) / 2;

        /* The delta is the difference between the server time and the ideal server local reception time, i.e. the
        local time at which the server should have received the message in case of perfectly symmetric lag. */
        let delta = serverTime - (txTime + delay);

        /* Add the sample to the clock, which will average the samples out. */
        FightsOnCore.#clock.addDeltaSample(delta);
    }

    /** Entity death message callback.
     * 
     * @param json Message content
     */
    onDeathMessage(json: any) {
        if (json.type === "airplane") {
            /* Remove the airplane from the list */
            let airplane = Simulation.getByUUID(json.uuid);
            if (airplane) {
                Simulation.removeSimulation(airplane);
                console.log(`Death event for airplane ${json.uuid}`);
            }
        }
    }

    /** State update message callback.
     * 
     * @param json Message content 
     */
    onUpdateMessage(json: any) {
        /* If the element has not been created yet, add it using its uuid as key */
        if (Simulation.getByUUID(json.uuid) === undefined) {
            switch (json.type) {
                case "airplane":
                    new Airplane(json.uuid, false, json.username);
                    break;
                case "bullet":
                    new Bullet();
                    break;
                case "missile":
                    new Missile(json.parent, json.uuid);
                    break;
            }
            
            console.log(`Birth event for ${json.type} ${json.uuid}`);
        }

        let dt = (FightsOnCore.#clock.getTime() - json.time) / 1000;

        /* Reject old messages */
        if (dt < 0.25) {
            /* Set the state of the simulation */
            Simulation.getByUUID(json.uuid)?.setState(json.state);

            /* Integrate to compensate for lag */
            Simulation.getByUUID(json.uuid)?.integrate(dt, false);
        }
    }

    /** Remove request message callback.
     * 
     * @param json Message content 
     */
    onRemoveMessage(json: any) {
        let simulation = Simulation.getByUUID(json.uuid);
        if (simulation) {
            Simulation.removeSimulation(simulation);
            console.log(`Remove event for ${json.type} ${json.uuid}`);
        }
    }

    /** This is the main loop of the application. Rendering and simulation loops are tied together, which is not good.
     * But for something this simple should be good enough.
     *  
     */
    loop() {
        /* If this is the first loop initialize the integration time */
        if (this.previousIntegrationTime == 0) {
            this.previousIntegrationTime = FightsOnCore.#clock.getTime();
        }
        else {
            /* Compute the time step */
            const newTime = FightsOnCore.#clock.getTime();
            const dt = (newTime - this.previousIntegrationTime) / 1000; /* To seconds */
            this.previousIntegrationTime = newTime;

            /* Set the user keyboard inputs to the ownship */
            const keyboardInputs = this.getKeyboardInputs();
            this.ownship.setKeyboardInputs(keyboardInputs);

            /* Read the gamepad controls */
            const gamepadInputs = this.getGamepadInputs();
            this.ownship.setGamepadInputs(gamepadInputs);
            
            /* Depending on the user inputs, fire any required weapons */
            this.ownship.fireWeapons(this.getKeyboardInputs()['gun'], this.getKeyboardInputs()['missile']);

            /* Integrate the simulation */
            this.integrate(dt);

            /* Render the scene */
            this.renderer.draw(this, dt);

            /* Send an update on the position of the ownship to the server */
            FightsOnCore.sendMessage(JSON.stringify({ id: "update", type: "airplane", uuid: this.uuid, time: FightsOnCore.#clock.getTime(), state: this.ownship.getState(), username: this.username }));

            /* Hit detection */
            //TODO
            //for (let bullet of this.bullets) {
            //    if (distance(this.ownship, bullet) < 10) {
            //        this.ownship.life -= 10;
            //    }
            //}
//
            ///* Hit detection */
            //for (let key in this.missiles) {
            //    let missile = this.missiles[key];
//
            //    if (distance(this.ownship, missile) < 10 && !missile.exploded) {
            //        this.ownship.life -= 50;
            //        this.missiles[key].exploded = true;
            //        FightsOnCore.sendMessage(JSON.stringify({ id: "remove", type: "missile", uuid: missile.uuid }));
            //    } 
            //}

            if (this.ownship.life <= 0) {
                window.clearInterval(this.interval);
                location.replace(location.href);
            }
        }
    }

    /** This function integrates all the elements of the simulation.
     * 
     * @param dt Delta time, in seconds, since last integration.
     */
    integrate(dt: number) {
        for (let simulation of Simulation.simulations) {
            simulation.integrate(dt);
        }
    }

    /** Gets the currently active keyboard inputs
     * 
     * @returns Inputs structure
     */
    getKeyboardInputs() {
        return {
            up: this.pressedKeys['KeyW'] ?? false,
            down: this.pressedKeys['KeyS'] ?? false,
            left: this.pressedKeys['KeyA'] ?? false,
            right: this.pressedKeys['KeyD'] ?? false,
            gun: this.pressedKeys['Space'] ?? false,
            missile: this.pressedKeys['KeyE'] ?? false,
        }
    }

    /** Gets the currently active gamepad inputs
     * 
     * @returns Inputs structure
     */
    getGamepadInputs() {
        let pitch: number | null = null;
        let roll: number | null = null;
        let thrust: number | null = null;
        let gun: boolean | null = null;

        let gamepads = navigator.getGamepads();

        if (this.gamepadControls.pitchControl) {
            let gamepad = gamepads.find((gamepad) => {return gamepad?.id === this.gamepadControls.pitchControl?.id })
            pitch = gamepad?.axes[this.gamepadControls.pitchControl.axis] ?? null;
        }

        if (this.gamepadControls.rollControl) {
            let gamepad = gamepads.find((gamepad) => {return gamepad?.id === this.gamepadControls.rollControl?.id })
            roll = gamepad?.axes[this.gamepadControls.rollControl.axis] ?? null;
        }

        if (this.gamepadControls.thrustControl) {
            let gamepad = gamepads.find((gamepad) => {return gamepad?.id === this.gamepadControls.thrustControl?.id })
            thrust = gamepad?.axes[this.gamepadControls.thrustControl.axis] ?? null;
        }

        return {
            pitch: pitch,
            roll: roll,
            thrust: thrust,
            gun: false //TODO
        }
    }

    /** On key down callback
     * 
     * @param ev Keyboard event
     */
    onKeyDown(ev: KeyboardEvent) {
        this.pressedKeys[ev.code] = true;
    }

    /** On key up event
     * 
     * @param ev Keyboard event
     */
    onKeyUp(ev: KeyboardEvent) {
        this.pressedKeys[ev.code] = false;
    }
}