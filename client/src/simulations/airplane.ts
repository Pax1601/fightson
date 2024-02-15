import { FightsOnCore, GamepadInputs, KeyboardInputs } from "../core";
import { Smoke } from "../renderer/effects/smoke";
import { computeDistance, hexToRGB, normalizeAngle, randomRgba } from "../utils/utils";
import { Bullet } from "./bullet";
import { ExplosionDebris } from "./explosiondebris";
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
    trailColor = "#0000FF";
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
            ctx.strokeStyle = hexToRGB(this.trailColor, 0.5);
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

        ctx.beginPath();
        ctx.strokeStyle = hexToRGB("#FFFF00", Math.min(1, Math.random() + 0.5));
        ctx.moveTo(-this.img.width / 2, 0);
        ctx.lineTo(-this.img.width / 2 - Math.max(0, this.throttlePosition - 0.8) * (20 + Math.random() * 5), 0);
        ctx.stroke();

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
        for (let i = 0; i < 5; i++) {
            let debris = new ExplosionDebris();
            let debrisTrack = this.track + Math.PI / 4 * (Math.random() - 0.5) * 2 * (i === 0? 0: 1); // At least one debris on the airplane track
            debris.setState({ x: this.x, y: this.y, track: debrisTrack, v: i === 0? this.v: 500 * Math.random()});
        }
    }

    /** Get the heat signature of the element
     * 
     * @param missile The missile "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(missile: Missile): number {
        /* Compute distance and bearing */
        let azimuth = Math.atan2(this.y - missile.y, this.x - missile.x);
        let bearing = normalizeAngle(missile.track - azimuth);
        let distance = computeDistance(this, missile);

        /* This is how far away the airplane is from the center of the missile head FOV */
        let deltaBearing = missile.headBearing - bearing;

        /* This is the aspect angle of the airplane from the missile head FOV. 0 means the missile
        is looking at the airplane tailpipe, PI is head to head */
        let aspect = (missile.track + missile.headBearing) - azimuth;

        /* Compute the heat signature */
        const baseSignature = 1.0;

        /* Multiplier due to throttle. High throttle values have a multiplier greater than 1 (Afterburner) */
        const throttleMultiplier = Math.min(1.5, Math.pow(this.throttlePosition, 4) + 0.5);

        /* Multiplier due to azimuth. Looking directly at the tailpipe causes the multiplier to be greater than 1 */
        const aspectMultiplier = Math.min(1.5, Math.pow(1 - aspect / Math.PI, 4) + 0.5);

        /* Distance multiplier. Being closer than 200 px casuses the multiplier to be greater than 1 */
        const distanceMultiplier = Math.min(1.5, Math.pow(200 / distance, 2));

        /* Multiplier due to bearing difference. Looking directly at the airplanes causes the multiplier to be greater than 1. It falls off very quickly outside of a narrow cone */
        let deltaBearingMultiplier = 0;
        if (Math.abs(deltaBearing) < missile.sensorCone) {
            deltaBearingMultiplier = 1.0;
        } else {
            deltaBearingMultiplier = Math.max(0, 1 - Math.abs(deltaBearing - missile.sensorCone) / missile.sensorCone);
        }

        if (!this.ownship) {
            console.log(throttleMultiplier, aspectMultiplier, distanceMultiplier, deltaBearingMultiplier)
        }
        
        return baseSignature * throttleMultiplier * aspectMultiplier * distanceMultiplier * deltaBearingMultiplier;
    }
}