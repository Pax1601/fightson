import { FightsOnCore, GamepadInputs, KeyboardInputs } from "../core";
import { Smoke } from "../renderer/effects/smoke";
import { computeDistance, normalizeAngle, randomRgba } from "../utils/utils";
import { Bullet } from "./bullet";
import { Flare } from "./flare";
import { Missile } from "./missile";
import { Simulation } from "./simulation";

/** Airplane simulation. Extends the basic Simulation class 
 *  
 */
export class Airplane extends Simulation {
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
    sensorCone = 0.1;
    sensorDistance = 500;
    missileCooldown = 0;
    missileCooldownPeriod = 5;

    /* Countermeasure parameters */
    flareCooldown = 0;
    flareCooldownPeriod = 0.1;

    /* Airplane inputs */
    keyboardInputs: KeyboardInputs = {
        up: false,
        down: false,
        left: false,
        right: false,
        gun: false,
        missile: false,
        flare: false
    };

    gamepadInputs: GamepadInputs = {
        pitch: null,
        roll: null,
        thrust: null,
        gun: null
    }

    /* Boolean to represent if this is the airplane controlled by the client */
    ownship: boolean;

    img: HTMLImageElement = new Image();
    trailColor = randomRgba();
    username = "";

    src = "client/img/airplanes/debug" //TODO: confiburable path
    
    constructor(uuid: string | undefined = undefined, ownship: boolean = true, username: string = "") {
        super(uuid);

        this.img.src = `${this.src}/top.png`; 
        this.username = username;
        this.ownship = ownship;
        this.type = "airplane";
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

        /* Apply flare cooldown to limit the number of flares deployed */
        if (this.flareCooldown > 0) {
            this.flareCooldown -= 1 / this.flareCooldownPeriod * dt;
            if (this.flareCooldown < 0)
                this.flareCooldown = 0;
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
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
        this.angleOfAttack = state.angleOfAttack ?? this.angleOfAttack;
        this.angleOfBank = state.angleOfBank ?? this.angleOfBank;
        this.throttlePosition = state.throttlePosition ?? this.throttlePosition;
        this.life = state.life ?? this.life;
    }

    /** Fire a weapon depending on the user input
     * 
     * @param fireGun True if gun is fired
     * @param fireMissile True if missile is fired
     */
    fireWeapons(fireGun: boolean, fireMissile: boolean) {
        if (fireGun) {
            let bullet = new Bullet();
            let gunTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank) + (Math.random() - 0.5) * 0.05;
            bullet.setState({ x: this.x + 10 * Math.cos(gunTrack), y: this.y + 10 * Math.sin(gunTrack), track: gunTrack, v: bullet.v + this.v });

            FightsOnCore.sendMessage({ id: "update", type: "bullet", parent: this.uuid, uuid: bullet.uuid, time: FightsOnCore.getClock().getTime(), state: bullet.getState() });
        }

        if (fireMissile && this.missileCooldown == 0) {
            let missile = new Missile(this.uuid);
            let missileTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank);
            missile.setState({ x: this.x + 20 * Math.cos(missileTrack), y: this.y + 10 * Math.sin(missileTrack), track: missileTrack, v: this.v });
            FightsOnCore.sendMessage({ id: "update", type: "missile", parent: this.uuid, uuid: missile.uuid, time: FightsOnCore.getClock().getTime(), state: missile.getState() });
            this.missileCooldown = 1.0;

            console.log(`Missile ${missile.uuid} launched by ${this.uuid}, is ownship: ${this.ownship}`)
        }
    }

    /** Deploy countermeasures
     * 
     * @param flare True if flare is requested
     */
    deployCounterMeasures(flare: boolean) {
        if (flare && this.flareCooldown === 0) {
            let flare = new Flare();
            let flareTrack = this.track;
            flare.setState({ x: this.x, y: this.y, track: flareTrack - Math.sign(this.angleOfBank) * (Math.abs(this.angleOfBank) > 0.3 ? 1 : 0) * Math.PI / 4, v: 500 });

            FightsOnCore.sendMessage({ id: "update", type: "flare", parent: this.uuid,  uuid: flare.uuid, time: FightsOnCore.getClock().getTime(), state: flare.getState() });

            this.flareCooldown = 1.0;
        }
    }

    /** Draw the airplane
     * 
     * @param ctx Canvas Rendering Context. 
     * @param x X coordinate position where the airplane must be drawn
     * @param y Y coordinate position where the airplane must be drawn
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Add the smoke */
        if (this.life < 70 && Math.random() < 0.8){
            let smokeTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank) + (Math.random() - 0.5) * 0.05;
            let xSmoke = this.x - 10 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 5;
            let ySmoke = this.y - 10 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 5;
            
            new Smoke(xSmoke, ySmoke, this.life * 255 / 100, this.life * 255 / 100, this.life * 255 / 100);
        }

        /* Draw the trail */
        if (this.trail.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = this.trailColor;
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        /* Draw the airplane */
        if (this.angleOfBank < -0.3) 
            this.img.src = `${this.src}/left.png`;
        else if (this.angleOfBank > 0.3) 
            this.img.src = `${this.src}/right.png`;
        else
            this.img.src = `${this.src}/top.png`;

        ctx.save();
        let xBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        let yBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        ctx.translate(x + xBuffet, y + yBuffet);
        ctx.rotate(this.track + 0.25 * this.angleOfAttack * this.angleOfBank);
        ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        ctx.restore();

        /* Draw the name */
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#FFFA";
        ctx.font = "14px Open Sans";
        ctx.textAlign = "center";
        ctx.fillText(this.username.substring(0, 10) + (this.username.length > 10? "...": ""), 0, -25);

        ctx.restore();
    }

    /** Simple callback on removal, for effects
     * 
     */
    onRemoval(): void {
        
    }

    /** Get the heat signature of the element
     * 
     * @param missile The missile "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(missile: Missile): number {
        let azimuth = Math.atan2(this.y - missile.y, this.x - missile.x);
        let bearing = normalizeAngle(missile.track - azimuth);
        let distance = computeDistance(this, missile);

        let deltaBearing = missile.headBearing - bearing;
        if (Math.abs(deltaBearing) < 1)
            return 1 - (distance / 500);
        else 
            return 0.0;
    }
}