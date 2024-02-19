import { FightsOnCore, GamepadInputs, KeyboardInputs } from "../core";
import { Smoke } from "../renderer/effects/smoke";
import { IRSensor } from "../sensors/irsensor";
import { computeDistance, computeSensorDistance, hexToRGB, normalizeAngle } from "../utils/utils";
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

    maxFuel = 100;
    maxFlares = 60;
    maxBullets = 200;
    maxMissiles = 4;

    fuel = this.maxFuel;
    flares = this.maxFlares;
    bullets = this.maxBullets;
    missiles = this.maxMissiles;

    /* Airplane specific controls */
    throttlePosition: number = 0.5;
    angleOfAttack: number = 0;

    /* Default speed at spawn */
    v: number = 100;

    /* Weapon parameters */
    missileCooldown = 0;
    missileCooldownPeriod = 1.0;

    /* Countermeasure parameters */
    flareCooldown = 0;
    flareCooldownPeriod = 0.1;

    /* Radar parameters */
    radarAngle = 0;
    radarDirection = 1; 
    radarSpeed = 1.5;
    radarPersistency = 2;
    radarContactPositions: {bearing: number, range: number, level: number}[] = [];
    radarScanWidth = 1;

    /* Reloading and refueling cooldowns */
    refuelingCooldownPeriod = 30;
    flaresReloadingCooldownPeriod = 10;
    missilesReloadingCooldownPeriod = 30;
    bulletsReloadingCooldownPeriod = 15;
    refuelingCooldown = 0;
    flaresReloadingCooldown = 0;
    missilesReloadingCooldown = 0;
    bulletsReloadingCooldown = 0;

    /* IR Sensor parameters */
    irsensor: IRSensor = new IRSensor();

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

    /* Boolean to represent if this is the airplane controlled by the client */
    ownship: boolean;

    lastUpdate: number = Date.now();

    imgTop: HTMLImageElement = new Image();
    imgLeft: HTMLImageElement = new Image();
    imgRight: HTMLImageElement = new Image();
    trailColor = "#0000FF";
    username = "";

    src = "client/img/airplanes/debug" //TODO: confiburable path
    
    constructor(uuid: string | undefined = undefined, ownship: boolean = true, username: string = "") {
        super(uuid);

        this.imgTop.src = `${this.src}/top.png`; 
        this.imgLeft.src = `${this.src}/left.png`; 
        this.imgRight.src = `${this.src}/right.png`; 
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

        /* Decrease fuel and check if refueling is required */
        if (this.fuel > 0) {
            this.fuel = Math.max(0, this.fuel - (Math.pow(this.throttlePosition, 8) + 0.2) * dt);
            if (this.fuel === 0)
                this.refuelingCooldown = this.refuelingCooldownPeriod;
        }

        /* Apply the keyboard and gamepad inputs */
        this.updateInputs(dt);

        /* Apply any cooldown, if present, to limit weapons and countermeasures */
        this.applyCooldowns(dt);

        /* Update the radar picture */
        this.updateRadar(dt);

        /* Update the IR sensor, which simulates the missile lock */
        this.updateIRSensor(dt);

        super.integrate(dt, addTrail);

        /* Timeout airplane */
        if (this.ownship) {
            this.lastUpdate = Date.now();
        } else {
            if (Date.now() - this.lastUpdate > 1000) {
                Simulation.removeSimulation(this, true, false);
            }
        }  
    }

    /** Set the keyboard inputs
     * 
     * @param keyboardInputs Inputs structure
     */
    setKeyboardInputs(keyboardInputs: KeyboardInputs) {
        this.keyboardInputs = keyboardInputs;
    }

    /** Update the inputs
     * 
     * @param dt Time step, in seconds
     */
    updateInputs(dt: number) {
        /* Keyboard callbacks in case of lack of gamepads */
        /* Change the angle of attack depending on the user input */
        if (this.keyboardInputs['right']) {
            if (this.angleOfAttack < 0)
                this.angleOfAttack = 0;
            else
                this.angleOfAttack = Math.min(1, this.angleOfAttack + dt);
        }
        else if (this.keyboardInputs['left']) {
            if (this.angleOfAttack > 0)
                this.angleOfAttack = 0;
            else
                this.angleOfAttack = Math.max(-1, this.angleOfAttack - dt);
        }
        else {
        }

        /* Change the angle of attack depending on the user input */
        if (this.keyboardInputs['up'])
            this.throttlePosition = Math.min(1, this.throttlePosition + dt) ;
        else if (this.keyboardInputs['down'])
            this.throttlePosition = Math.max(0, this.throttlePosition - dt);
        else
            this.throttlePosition = Math.min(0.8, this.throttlePosition) ;
    }

    /** Apply cooldowns to weapons and reloads
     * 
     * @param dt Time step, in seconds
     */
    applyCooldowns(dt: number) {
        /* Apply missile cooldown to limit the number of missiles fired */
        if (this.missileCooldown > 0) {
            this.missileCooldown -= dt;
            if (this.missileCooldown < 0)
                this.missileCooldown = 0;
        }

        /* Apply flare cooldown to limit the number of flares deployed */
        if (this.flareCooldown > 0) {
            this.flareCooldown -= dt;
            if (this.flareCooldown < 0)
                this.flareCooldown = 0;
        }

        /* Refueling and rearming cooldowns */
        if (this.fuel === 0 && this.refuelingCooldown === 0) 
            this.fuel = this.maxFuel;
        else  {
            this.refuelingCooldown -= dt;
            if (this.refuelingCooldown < 0)
                this.refuelingCooldown = 0;
        }

        if (this.flares === 0 && this.flaresReloadingCooldown === 0) 
            this.flares = this.maxFlares;
        else  {
            this.flaresReloadingCooldown -= dt;
            if (this.flaresReloadingCooldown < 0)
                this.flaresReloadingCooldown = 0;
        }

        if (this.missiles === 0 && this.missilesReloadingCooldown === 0) 
            this.missiles = this.maxMissiles;
        else  {
            this.missilesReloadingCooldown -= dt;
            if (this.missilesReloadingCooldown < 0)
                this.missilesReloadingCooldown = 0;
        }

        if (this.bullets === 0 && this.bulletsReloadingCooldown === 0) 
            this.bullets = this.maxBullets;
        else  {
            this.bulletsReloadingCooldown -= dt;
            if (this.bulletsReloadingCooldown < 0)
                this.bulletsReloadingCooldown = 0;
        }
    }

    /** Compute the lift of the airplane
     * 
     * @returns The lift of the airplane
     */
    computeLift() {
        /* Below stall, lift increases linearly */
        if (Math.abs(this.angleOfAttack) < this.maxAngleOfAttack) {
            this.stalled = false;
            return (this.v / 200 * this.v / 200) * this.liftCoefficient * this.angleOfAttack;
        }
        /* After stall lift drops quickly */
        else {
            this.stalled = true;
            return (this.v / 200 * this.v / 200) * this.maxAngleOfAttack * this.liftCoefficient * (1 + (this.maxAngleOfAttack - Math.abs(this.angleOfAttack)) / this.maxAngleOfAttack * 2) * Math.sign(this.angleOfAttack);
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
        return (this.fuel > 0? 1 : 0) * this.maxThrust * Math.pow(this.throttlePosition, 4) * (1 + 0.8 * this.v / 360);
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
        this.throttlePosition = state.throttlePosition ?? this.throttlePosition;
        this.life = state.life ?? this.life;

        this.lastUpdate = Date.now();
    }

    /** Fire a weapon depending on the user input
     * 
     * @param fireGun True if gun is fired
     * @param fireMissile True if missile is fired
     */
    fireWeapons(fireGun: boolean, fireMissile: boolean) {
        if (fireGun && this.bullets > 0) {
            let bullet = new Bullet();
            let gunTrack = this.track + 0.25 * this.angleOfAttack + (Math.random() - 0.5) * 0.05;
            bullet.setState({ x: this.x + 10 * Math.cos(gunTrack), y: this.y + 10 * Math.sin(gunTrack), track: gunTrack, v: bullet.v + this.v });

            FightsOnCore.sendMessage({ id: "update", type: "bullet", parent: this.uuid, uuid: bullet.uuid, time: FightsOnCore.getClock().getTime(), state: bullet.getState(), ssc: ++bullet.ssc });
            this.bullets--;

            if (this.bullets === 0)
                this.bulletsReloadingCooldown = this.bulletsReloadingCooldownPeriod;
        }

        if (fireMissile && this.missileCooldown == 0 && this.missiles > 0) {
            let missile = new Missile(this.uuid);
            let missileTrack = this.track + 0.25 * this.angleOfAttack ;
            missile.setState({ x: this.x + 20 * Math.cos(missileTrack), y: this.y + 10 * Math.sin(missileTrack), track: missileTrack, v: this.v, headBearing: this.irsensor.headBearing });
    
            console.log(`Missile ${missile.uuid} launched by ${this.uuid}, is ownship: ${this.ownship}`);
            FightsOnCore.sendMessage({ id: "update", type: "missile", parent: this.uuid, uuid: missile.uuid, time: FightsOnCore.getClock().getTime(), state: missile.getState(), ssc: ++missile.ssc });

            this.missileCooldown = this.missileCooldownPeriod;
            this.missiles--;

            if (this.missiles === 0)
                this.missilesReloadingCooldown = this.missilesReloadingCooldownPeriod;
        }
    }

    /** Deploy countermeasures
     * 
     * @param flare True if flare is requested
     */
    deployCounterMeasures(flare: boolean) {
        if (flare && this.flareCooldown === 0 && this.flares > 0) {
            let flare = new Flare();
            let flareTrack = this.track;
            flare.setState({ x: this.x, y: this.y, track: flareTrack - Math.sign(this.angleOfAttack) * Math.PI / 4, v: 500 });

            FightsOnCore.sendMessage({ id: "update", type: "flare", parent: this.uuid,  uuid: flare.uuid, time: FightsOnCore.getClock().getTime(), state: flare.getState(), ssc: ++flare.ssc });

            this.flareCooldown = this.flareCooldownPeriod;
            this.flares--;

            if (this.flares === 0)
                this.flaresReloadingCooldown = this.flaresReloadingCooldownPeriod;
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
            let smokeTrack = this.track + 0.25 * this.angleOfAttack + (Math.random() - 0.5) * 0.05;
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
        ctx.save();
        let xBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        let yBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        ctx.translate(x + xBuffet, y + yBuffet);
        ctx.rotate(this.track + 0.25 * this.angleOfAttack);
        if (this.angleOfAttack < -0.1) 
            ctx.drawImage(this.imgLeft, -this.imgLeft.width / 2, -this.imgLeft.height / 2);
        else if (this.angleOfAttack > 0.1) 
            ctx.drawImage(this.imgRight, -this.imgRight.width / 2, -this.imgRight.height / 2);
        else
            ctx.drawImage(this.imgTop, -this.imgTop.width / 2, -this.imgTop.height / 2);
        

        /* Draw afterburner */
        if (this.fuel > 0) {
            ctx.beginPath();
            ctx.strokeStyle = hexToRGB("#FFFF00", Math.min(1, Math.random() + 0.5));
            ctx.moveTo(-this.imgTop.width / 2, 0);
            ctx.lineTo(-this.imgTop.width / 2 - Math.max(0, this.throttlePosition - 0.8) * (20 + Math.random() * 5), 0);
            ctx.stroke();
        }

        ctx.restore();

        /* Draw the name */
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#FFFA";
        ctx.font = "14px Open Sans";
        ctx.textAlign = "center";
        ctx.fillText(this.username.substring(0, 10) + (this.username.length > 10? "...": ""), 0, -25);
        ctx.restore();

        /* Draw a lock symbol on the locked target, if present */
        if (this.ownship && this.irsensor.lockedTarget) {
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.translate(this.irsensor.lockedTarget.x, this.irsensor.lockedTarget.y);
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = "red";
            ctx.translate(this.irsensor.lockedTarget.x, this.irsensor.lockedTarget.y);
            for (let i = 0; i <= 4; i++) {
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(25, 0);
                ctx.stroke();
                ctx.rotate(Math.PI / 2);
            }
            ctx.restore();
        }

        /* For debugging, draw the sensor head direction */
        if (FightsOnCore.debug && this.ownship) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.irsensor.track);
            ctx.rotate(this.irsensor.headBearing);
            ctx.strokeStyle = "red";

            ctx.rotate(this.irsensor.sensorCone);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1000, 0);
            ctx.stroke();

            ctx.rotate(-2 * this.irsensor.sensorCone);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1000, 0);
            ctx.stroke();
            
            ctx.restore();
        }
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
     * @param sensor The sensor "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(sensor: IRSensor): number {
        /* Compute distance and bearing */
        let azimuth = Math.atan2(this.y - sensor.y, this.x - sensor.x);
        let bearing = normalizeAngle(azimuth - sensor.track);
        let distance = computeSensorDistance(this, sensor);

        /* This is how far away the airplane is from the center of the missile head FOV */
        let deltaBearing = sensor.headBearing - bearing;

        /* This is the aspect angle of the airplane from the missile head FOV. 0 means the missile
        is looking at the airplane tailpipe, PI is head to head */
        let aspect = (sensor.track + sensor.headBearing) - azimuth;

        /* Compute the heat signature */
        const baseSignature = 1.0;

        /* Multiplier due to throttle. High throttle values have a multiplier greater than 1 (Afterburner) */
        const throttleMultiplier = Math.min(1.5, Math.pow(this.throttlePosition, 4) + 0.5);

        /* Multiplier due to azimuth. Looking directly at the tailpipe causes the multiplier to be greater than 1 */
        const aspectMultiplier = Math.min(1.5, Math.pow(1 - aspect / Math.PI, 4) + 0.5);

        /* Distance multiplier. Being closer than 500 px casuses the multiplier to be greater than 1 */
        const distanceMultiplier = Math.min(1.5, Math.pow(500 / distance, 2));

        /* Multiplier due to bearing difference. Looking directly at the airplanes causes the multiplier to be greater than 1. It falls off very quickly outside of a narrow cone */
        let deltaBearingMultiplier = 0;
        if (Math.abs(deltaBearing) < sensor.sensorCone) {
            deltaBearingMultiplier = 1.0;
        } else {
            deltaBearingMultiplier = Math.max(0, 1 - Math.abs(deltaBearing - sensor.sensorCone) / sensor.sensorCone);
        }

        return baseSignature * throttleMultiplier * aspectMultiplier * distanceMultiplier * deltaBearingMultiplier;
    }

    /** Updates the radar simulation
     * 
     * @param dt Time step, in seconds
     */
    updateRadar(dt: number) {
        /* Animate the radar scan */
        this.radarAngle += this.radarDirection * this.radarSpeed * dt;
        if (this.radarAngle >= this.radarScanWidth)
            this.radarDirection = -1;
        else if (this.radarAngle <= -1)
            this.radarDirection = this.radarScanWidth;

        /* Update the radar tracks */
        for (let airplane of Simulation.getAllByType("airplane")) {
            if (airplane !== FightsOnCore.getOwnship()) {
                let azimuth = Math.atan2(airplane.y - FightsOnCore.getOwnship().y, airplane.x - FightsOnCore.getOwnship().x);
                let bearing = normalizeAngle(FightsOnCore.getOwnship().track - azimuth);
                let range = Math.sqrt(Math.pow(airplane.x - FightsOnCore.getOwnship().x, 2) + Math.pow(airplane.y - FightsOnCore.getOwnship().y, 2));
                if (Math.abs(bearing + this.radarAngle) < this.radarSpeed * dt) {
                    this.radarContactPositions.push({bearing: bearing, range: range, level: 1});
                }
            }
        }

        /* Remove old contacts */
        this.radarContactPositions = this.radarContactPositions.filter((contact) => {return contact.level > 0});
    }

    /** Updates the IR Sensor simulation
     * 
     * @param dt Time step, in seconds
     */
    updateIRSensor(dt: number) {
        /* The sensor head is attached in front of the airplane */
        this.irsensor.track = this.track + 0.25 * this.angleOfAttack;
        this.irsensor.x = this.x + 10 * Math.cos(this.track);
        this.irsensor.y = this.y + 10 * Math.sin(this.track);

        this.irsensor.lockTarget();
        this.irsensor.slewHeadToTarget(dt);

        /* If there are no locked targets, bring the head back to boresight */
        if (this.irsensor.lockedTarget === null) {
            this.irsensor.headBearing -= 0.1 * this.irsensor.headBearing;
        }
    }
}