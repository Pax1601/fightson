import { Airplane } from "./simulations/airplane";
import { Bullet } from "./simulations/bullet";
import { Missile } from "./simulations/missile";
import { Clock } from "./clock/clock";
import { LoginState } from "./ui/login";
import { Renderer } from "./renderer/renderer";
import { sleep } from "./utils/utils";
import { Simulation } from "./simulations/simulation";
import { Flare } from "./simulations/flare";

const DEBUG = false;

/* Desired internal loop frequency */
const FPS = 60;

/* User inputs interface */
export interface KeyboardInputs {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    gun: boolean,
    missile: boolean,
    flare: boolean
}

export interface GamepadInputs {
    pitch: number | null,
    roll: number | null,
    thrust: number | null,
    gun: boolean | null
}

export class FightsOnCore {
    static debug = DEBUG;

    username: string = "";

    previousIntegrationTime: number = 0;
    pressedKeys: { [key: string]: boolean } = {};
    interval: number = 0;

    /* Static members and methods */
    static #webSocket: WebSocket;
    static #clock: Clock;
    static #renderer: Renderer;
    static #ownship: Airplane;

    /** Send a message via the websocket
     * 
     * @param json Message to send
     */
    static sendMessage(json: any) {
        FightsOnCore.#webSocket.send(JSON.stringify(json));
    }

    /** Get the static clock object
     * 
     * @returns The core clock
     */
    static getClock() {
        return FightsOnCore.#clock;
    }

    /** Get the static renderer
     * 
     * @returns The renderer
     */
    static getRenderer() {
        return FightsOnCore.#renderer;
    }

    /** Get the static ownship
     * 
     * @returns Thwe ownship
     */
    static getOwnship() {
        return FightsOnCore.#ownship;
    }
    
    constructor() {
        /* Connect to the websocket */
        FightsOnCore.#webSocket = new WebSocket(`ws://${location.host + location.pathname}`); //TODO configurable

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
            FightsOnCore.#renderer = new Renderer(canvas as HTMLCanvasElement);
        else
            throw "Error retrieving canvas"

        /* Initialize the player airplane */
        FightsOnCore.#ownship = new Airplane();
    }

    /** Asynchronously starts the app
     * 
     */
    async start(loginState: LoginState) {
        /* Read the login state */
        this.username = loginState.username;

        /* Wait for the WebSocket to actually connect */
        this.waitForConnection().then(
            async () => {
                /* Send user data */
                FightsOnCore.sendMessage({ id: "data", username: this.username, uuid: FightsOnCore.getOwnship().uuid });

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
            FightsOnCore.sendMessage({ id: "synchronization", time: Date.now() });
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
        console.log("Successfully connected to server")
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
                console.log(`Disconnect event for airplane ${json.uuid}`);
            }
        }
    }

    /** State update message callback.
     * 
     * @param json Message content 
     */
    onUpdateMessage(json: any) {
        /* If the element has not been created yet, add it using its uuid as key */
        if (Simulation.getByUUID(json.uuid) === undefined && !Simulation.removedUuids.includes(json.uuid)) {
            switch (json.type) {
                case "airplane":
                    new Airplane(json.uuid, false, json.username);
                    console.log(`Birth event for ${json.username}, uuid ${json.uuid}`);
                    break;
                case "bullet":
                    new Bullet(json.uuid);
                    break;
                case "flare":
                    new Flare(json.uuid);
                    break;
                case "missile":
                    new Missile(json.parent, json.uuid);
                    console.log(`Birth event for ${json.type}, uuid ${json.uuid}, parent ${json.parent}`);
                    break;
            }
        }

        /* Check if the simulation was successfully registered */
        let simulation = Simulation.getByUUID(json.uuid);
        if (simulation !== undefined) {
            let dt = (FightsOnCore.#clock.getTime() - json.time) / 1000;

            /* Reject old messages */
            if (dt < 0.25){
                if (json.ssc > simulation.ssc) {
                    /* Set the state of the simulation */
                    simulation.setState(json.state);

                    /* Update the ssc */
                    simulation.ssc = json.ssc;

                    /* Integrate to compensate for lag. Split the integration up in many smaller steps if needed */
                    let tdt = dt;
                    while (tdt > 0) {
                        let sdt = Math.min(tdt, 1 / FPS);
                        simulation.integrate(sdt, false);
                        tdt -= sdt;
                    }
                } else {
                    console.log(`Message from ${json.uuid} rejected, old ssc. ssc = ${json.ssc}, latest ssc ${simulation.ssc}`);
                }
            } else {
                console.log(`Message from ${json.uuid} rejected, too old. dt = ${dt}s`);
            }
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

            /* Check if ownship is still alive */
            if (FightsOnCore.getOwnship().life > 0) {
                /* Set the user keyboard inputs to the ownship */
                const keyboardInputs = this.getKeyboardInputs();
                FightsOnCore.getOwnship().setKeyboardInputs(keyboardInputs);
                
                /* Depending on the user inputs, fire any required weapons */
                FightsOnCore.getOwnship().fireWeapons(this.getKeyboardInputs()['gun'], this.getKeyboardInputs()['missile']);

                /* Depending on the user inputs, deploy any required countermearsures */
                FightsOnCore.getOwnship().deployCounterMeasures(this.getKeyboardInputs()['flare']);

                /* Send an update on the position of the ownship to the server */
                FightsOnCore.sendMessage({ id: "update", type: "airplane", uuid: FightsOnCore.getOwnship().uuid, time: newTime, state: FightsOnCore.getOwnship().getState(), username: this.username, ssc: ++FightsOnCore.getOwnship().ssc });
            } else {
                /* Remove the ownship */
                Simulation.removeSimulation(FightsOnCore.getOwnship());
                FightsOnCore.sendMessage({ id: "remove", type: "airplane", uuid: FightsOnCore.getOwnship().uuid });
            }

            /* Integrate the simulation */
            this.integrate(dt);

            /* Render the scene */
            FightsOnCore.getRenderer().draw(dt);
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
            flare: this.pressedKeys['KeyQ'] ?? false
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