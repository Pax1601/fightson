import { FightsOnCore, GamepadInputs, KeyboardInputs } from "../core";
import { Airplane } from "./airplane";
import { Bullet } from "./bullet";
import { GraphicalSimulation } from "./graphicalsimulation";
import { Missile } from "./missile";
import { Simulation } from "./simulation";

/** Airplane simulation. Extends the basic GraphicalSimulation class 
 *  
 */
export abstract class AirplaneSimulation extends GraphicalSimulation {
    /* Default parameters */
    maxThrust = 100;
    liftCoefficient = 2;
    dragCoefficient = 1e-3;
    efficiency = 1;
    minSpeed = 50;
    maxAngleOfAttack = 0.8;
    stalled = false;
    life = 100;
    rollInertia = 0.3;
    pitchInertia = 1;

    /* Airplane specific controls */
    throttlePosition: number = 0.5;
    angleOfAttack: number = 0;
    angleOfBank: number = 0;

    /* Default speed at spawn */
    v: number = 100;

    /* Weapon parameters */
    missileCooldown = 0;
    missileCooldownPeriod = 5;

    /* Airplane inputs */
    keyboardInputs: KeyboardInputs = {
        up: false,
        down: false,
        left: false,
        right: false,
        gun: false,
        missile: false
    };

    gamepadInputs: GamepadInputs = {
        pitch: null,
        roll: null,
        thrust: null,
        gun: null
    }

    /* Boolean to represent if this is the airplane controlled by the client */
    ownship: boolean;

    constructor(uuid: string | undefined = undefined, ownship: boolean = false) {
        super(uuid);
        this.ownship = ownship;
    }

    /** Integrate the simulation forward
     * 
     * @param dt Delta time, in seconds
     */
    integrate(dt: number, addTrail: boolean = true) {
        this.angleOfAttack -= 0.5 * this.angleOfAttack * dt;

        /* Keyboard callbacks in case of lack of gamepads */
        if (false) {
            /* Change the angle of bank depending on the user input */
            if (this.keyboardInputs['left'])
                this.angleOfBank = Math.max(-1, this.angleOfBank - 1 / this.rollInertia * dt);
            else if (this.keyboardInputs['right'])
                this.angleOfBank = Math.min(1, this.angleOfBank + 1 / this.rollInertia * dt);

            /* Change the angle of attack depending on the user input */
            if (this.keyboardInputs['up'])
                this.angleOfAttack = Math.max(-0.3, this.angleOfAttack - dt);
            else if (this.keyboardInputs['down'])
                this.angleOfAttack = Math.min(1, this.angleOfAttack + dt);
        } else {
            if (this.keyboardInputs['left'])
                this.angleOfBank = Math.max(-1, this.angleOfBank - 1 / this.rollInertia * dt);
            else if (this.keyboardInputs['right'])
                this.angleOfBank = Math.min(1, this.angleOfBank + 1 / this.rollInertia * dt);
            
            /* Change the angle of attack depending on the user input */
            if (this.keyboardInputs['left']) {
                if (this.angleOfBank < 0) {
                    this.angleOfAttack = Math.min(1, this.angleOfAttack + dt);
                } else {
                    this.angleOfAttack -= dt;
                }
            }
            else if (this.keyboardInputs['right']) {
                if (this.angleOfBank >= 0) {
                    this.angleOfAttack = Math.min(1, this.angleOfAttack + dt);
                } else {
                    this.angleOfAttack -= dt;
                }
            }

            /* Change the angle of attack depending on the user input */
            if (this.keyboardInputs['up'])
                this.throttlePosition = Math.min(1, this.throttlePosition + dt) ;
            else if (this.keyboardInputs['down'])
                this.throttlePosition = Math.max(-1, this.throttlePosition - dt);
        }

        /* Set the agle of attack depeding on the axis input, if present */
        if (this.gamepadInputs.pitch) {
            if (this.gamepadInputs.pitch > 0)
                this.angleOfAttack = this.gamepadInputs.pitch;
            else
                this.angleOfAttack = this.gamepadInputs.pitch * 0.3;
        }

        /* Set the bank agle depeding on the axis input, if present */
        if (this.gamepadInputs.roll) {
            this.angleOfBank += 1 / this.rollInertia * this.gamepadInputs.roll * dt;
            this.angleOfBank = Math.max(this.angleOfBank, -1);
            this.angleOfBank = Math.min(this.angleOfBank, 1);
        }

        /* Apply missile cooldown to limit the number of missiles fired */
        if (this.missileCooldown > 0) {
            this.missileCooldown -= 1 / this.missileCooldownPeriod * dt;
            if (this.missileCooldown < 0)
                this.missileCooldown = 0;
        }

        super.integrate(dt, addTrail);
    }

    /** Set the keyboard inputs
     * 
     * @param keyboardInputs Inputs structure
     */
    setKeyboardInputs(keyboardInputs: KeyboardInputs) {
        this.keyboardInputs = keyboardInputs;
    }

    /** Set the keyboard inputs
     * 
     * @param gamepadInputs Inputs structure
     */
    setGamepadInputs(gamepadInputs: GamepadInputs) {
        this.gamepadInputs = gamepadInputs;
    }

    /** Compute the lift of the airplane
     * 
     * @returns The lift of the airplane
     */
    computeLift() {
        /* Below stall, lift increases linearly */
        if (Math.abs(this.angleOfAttack) < this.maxAngleOfAttack) {
            this.stalled = false;
            return (this.v / 200 * this.v / 200) * this.liftCoefficient * this.angleOfAttack * Math.sign(this.angleOfBank) * (Math.abs(this.angleOfBank) > 0.3 ? 1 : 0);
        }
        /* After stall lift drops quickly */
        else {
            this.stalled = true;
            return (this.v / 200 * this.v / 200) * this.maxAngleOfAttack * this.liftCoefficient * (1 + (this.maxAngleOfAttack - Math.abs(this.angleOfAttack)) / this.maxAngleOfAttack * 2) * Math.sign(this.angleOfAttack) * Math.sign(this.angleOfBank) * (Math.abs(this.angleOfBank) > 0.3 ? 1 : 0);
        }
    }
    /** Compute the airplane drag
     * 
     * @returns The drag of the airplane
     */
    computeDrag() {
        /* Drag increases with the sqare of speed, and has a constant and induced part, which in turns increases with the square of angle of attack */
        return this.dragCoefficient * this.v * this.v * (1 + 1 / this.efficiency * this.angleOfAttack * this.angleOfAttack);
    }

    /** Compute the airplane thrust
     * 
     * @returns The thrust of the airplane
     */
    computeThrust() {
        /* Thrust increases linearly with throttle */
        return this.maxThrust * this.throttlePosition * (1 + 0.8 * this.v / 360);
    }

    /** Clamps the velocity to a minimum value
     * 
     */
    clampVelocity() {
        if (this.v < this.minSpeed)
            this.v = this.minSpeed;
    }

    /** Gets the current state of the airplane
     * 
     * @returns The state of the airplane
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track,
            angleOfAttack: this.angleOfAttack,
            angleOfBank: this.angleOfBank,
            throttlePosition: this.throttlePosition,
            life: this.life
        }
    }

    /** Sets the state of the airplane
     * 
     * @param state The state of the airplane
     */
    setState(state: any) {
        this.x = state.x;
        this.y = state.y;
        this.v = state.v;
        this.track = state.track;
        this.angleOfAttack = state.angleOfAttack;
        this.angleOfBank = state.angleOfBank;
        this.throttlePosition = state.throttlePosition;
        this.life = state.life;
    }

    fireWeapons(fireGun: boolean, fireMissile: boolean) {
        if (fireGun) {
            let bullet = new Bullet();
            let gunTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank) + (Math.random() - 0.5) * 0.05;
            bullet.setState({ x: this.x + 10 * Math.cos(gunTrack), y: this.y + 10 * Math.sin(gunTrack), track: gunTrack, v: bullet.v + this.v });

            FightsOnCore.sendMessage({ id: "update", type: "bullet", parent: this.uuid, time: FightsOnCore.getClock().getTime(), state: bullet.getState() });
        }

        if (fireMissile && this.missileCooldown == 0) {
            let missile = new Missile(this.uuid);
            let missileTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank);
            missile.setState({ x: this.x + 20 * Math.cos(missileTrack), y: this.y + 10 * Math.sin(missileTrack), track: missileTrack, v: this.v });
            missile.lockTarget(Simulation.getAllByType("airplane") as Airplane[]);

            FightsOnCore.sendMessage({ id: "update", type: "missile", parent: this.uuid, uuid: missile.uuid, time: FightsOnCore.getClock().getTime(), state: missile.getState() });
            this.missileCooldown = 1.0;
        }
    }
}