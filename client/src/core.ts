import { Airplane } from "./airplane";
import { Bullet } from "./bullet";
import { Missile } from "./missile";
import { Clock } from "./clock";
import { LoginState } from "./login";
import { Renderer } from "./renderer";
import { distance, sleep } from "./utils";

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

    webSocket: WebSocket;
    clock: Clock;
    renderer: Renderer;
    ownship: Airplane;
    airplanes: { [key: string]: Airplane } = {};
    bullets: Bullet[] = [];
    missiles: Missile[] = [];
    previousIntegrationTime: number = 0;
    pressedKeys: { [key: string]: boolean } = {};
    interval: number = 0;
    gamepadControls: {
        pitchControl: { id: string, axis: number } | null,
        rollControl: { id: string, axis: number } | null,
        thrustControl: { id: string, axis: number } | null,
        gunControl: { id: string, button: number } | null
    }

    missileCooldown = 0;
    missileCooldownPeriod = 5;

    constructor() {
        /* Connect to the websocket */
        this.webSocket = new WebSocket(`ws://${document.location.hostname}:${Number(document.location.port) + 1}`); //TODO configurable

        /* Start the synchronized clock */
        this.clock = new Clock();

        /* Define listeners */
        this.webSocket.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data.toString())));
        this.webSocket.addEventListener('close', (ev) => this.onClose(ev));

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
        this.ownship = new Airplane(true);
        this.airplanes = { "ownship": this.ownship };

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
                this.webSocket.send(data);


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
            if (this.webSocket.readyState === this.webSocket.OPEN) {
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
            this.webSocket.send(data);
            await sleep(100);
        }
        console.log(`Estimated time delta: ${this.clock.delta}ms`)
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
        this.clock.addDeltaSample(delta);
    }

    /** Entity death message callback.
     * 
     * @param json Message content
     */
    onDeathMessage(json: any) {
        if (json.type === "airplane") {
            /* Remove the airplane from the list */
            delete this.airplanes[json.uuid];
            console.log(`Death event for airplane ${json.uuid}`);
        }
    }

    /** State update message callback.
     * 
     * @param json Message content 
     */
    onUpdateMessage(json: any) {
        if (json.type === "airplane") {
            /* If the airplane is not yet in the dictionary, add it using its uuid as key */
            if (!(json.uuid in this.airplanes)) {
                this.airplanes[json.uuid] = new Airplane(false, json.username);
                console.log(`Birth event for airplane ${json.uuid}`);
            }

            let dt = (this.clock.getTime() - json.time) / 1000;

            /* Reject old messages */
            if (dt < 0.25) {
                /* Set the state of the airplane */
                this.airplanes[json.uuid].setState(json.state);

                /* Integrate to compensate for lag */
                this.airplanes[json.uuid].integrate(dt, false);
            }
        } else if (json.type === "bullet") {
            /* Create the bullet. Bullet update signals are only sent on bullet creation to avoid 
            excessive data transfers */
            let bullet = new Bullet();

            /* Set the bullet state */
            bullet.setState(json.state);

            /* Integrate to compensate for lag */
            let dt = (this.clock.getTime() - json.time) / 1000;
            bullet.integrate(dt);

            /* Add the bullet to the list */
            this.bullets.push(bullet);
        } else if (json.type === "missile") {
            /* Create the missile. Missile update signals are only sent on missile creation to avoid 
            excessive data transfers */
            let missile = new Missile();

            /* Set the missile state */
            missile.setState(json.state);

            /* Integrate to compensate for lag */
            let dt = (this.clock.getTime() - json.time) / 1000;
            missile.integrate(dt);

            /* Add the missile to the list */
            this.missiles.push(missile);
        }
    }

    /** This is the main loop of the application. Rendering and simulation loops are tied together, which is not good.
     * But for something this simple should be good enough.
     *  
     */
    loop() {
        /* If this is the first loop initialize the integration time */
        if (this.previousIntegrationTime == 0) {
            this.previousIntegrationTime = this.clock.getTime();
        }
        else {
            /* Compute the time step */
            const newTime = this.clock.getTime();
            const dt = (newTime - this.previousIntegrationTime) / 1000; /* To seconds */
            this.previousIntegrationTime = newTime;

            /* Set the user keyboard inputs to the ownship */
            const keyboardInputs = this.getKeyboardInputs();
            this.ownship.setKeyboardInputs(keyboardInputs);

            /* Read the gamepad controls */
            const gamepadInputs = this.getGamepadInputs();
            this.ownship.setGamepadInputs(gamepadInputs);

            /* Apply missile cooldown to limit the number of missiles fired */
            if (this.missileCooldown > 0) {
                this.missileCooldown -= 1 / this.missileCooldownPeriod * dt;
                if (this.missileCooldown < 0)
                    this.missileCooldown = 0;
            }
            
            /* Depending on the user inputs, fire any required weapons */
            this.fireWeapons();

            /* Integrate the simulation */
            this.integrate(dt);

            /* Render the scene */
            this.renderer.draw(this, dt);

            /* Send an update on the position of the ownship to the server */
            this.webSocket.send(JSON.stringify({ id: "update", type: "airplane", uuid: this.uuid, time: this.clock.getTime(), state: this.ownship.getState(), username: this.username }));

            /* Hit detection */
            for (let bullet of this.bullets) {
                if (distance(this.ownship, bullet) < 10) {
                    this.ownship.life -= 10;
                }
                if (this.ownship.life <= 0) {
                    window.clearInterval(this.interval);
                    location.replace(location.href);
                }
            }

            /* Hit detection */
            for (let missile of this.missiles) {
                if (distance(this.ownship, missile) < 10) {
                    this.ownship.life -= 50;
                }
                if (this.ownship.life <= 0) {
                    window.clearInterval(this.interval);
                    location.replace(location.href);
                }

                // TODO remove missile
            }
        }
    }

    /** This function integrates all the elements of the simulation.
     * 
     * @param dt Delta time, in seconds, since last integration.
     */
    integrate(dt: number) {
        /* Integrate all the aiplanes */
        for (let airplane of Object.values(this.airplanes)) {
            airplane.integrate(dt);
        }

        /* Integrate all the bullets */
        for (let bullet of this.bullets) {
            bullet.integrate(dt);
            /* Remove any bullet that got too slow. TODO: move inside bullet class */
            if (bullet.v < 250)
                this.bullets = this.bullets.filter(b => b !== bullet);
        }

        /* Integrate all the missiles */
        for (let missile of this.missiles) {
            missile.integrate(dt);
            /* Remove any missile that got too slow. TODO: move inside missile class */
            if (missile.v < 50)
                this.missiles = this.missiles.filter(b => b !== missile);
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

    /** Fires weapons depending on current inputs.
     *  TODO: move into airplane class
     */
    fireWeapons() {
        if (this.getKeyboardInputs()['gun']) {
            let bullet = new Bullet();
            let gunTrack = this.ownship.track + 0.25 * this.ownship.angleOfAttack * Math.sign(this.ownship.angleOfBank) + (Math.random() - 0.5) * 0.05;
            bullet.setState({ x: this.ownship.x + 10 * Math.cos(gunTrack), y: this.ownship.y + 10 * Math.sin(gunTrack), track: gunTrack, v: bullet.v + this.ownship.v });
            this.bullets.push(bullet);
            this.webSocket.send(JSON.stringify({ id: "update", type: "bullet", uuid: this.uuid, time: this.clock.getTime(), state: bullet.getState() }));
        }

        if (this.getKeyboardInputs()['missile'] && this.missileCooldown == 0) {
            let missile = new Missile();
            let missileTrack = this.ownship.track + 0.25 * this.ownship.angleOfAttack * Math.sign(this.ownship.angleOfBank);
            missile.setState({ x: this.ownship.x + 20 * Math.cos(missileTrack), y: this.ownship.y + 10 * Math.sin(missileTrack), track: missileTrack, v: this.ownship.v });
            missile.lockTarget(Object.values(this.airplanes));
            this.missiles.push(missile);
            this.webSocket.send(JSON.stringify({ id: "update", type: "missile", uuid: this.uuid, time: this.clock.getTime(), state: missile.getState() }));
            this.missileCooldown = 1.0;
        }
    }
}