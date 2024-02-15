import { Airplane } from "./airplane";
import { computeDistance, normalizeAngle } from "../utils/utils";
import { FightsOnCore } from "../core";
import { SmallExplosion } from "../renderer/effects/smallexplosion";
import { Smoke } from "../renderer/effects/smoke";
import { Simulation } from "./simulation";

/** Missile simulation, extends the basic Simulation class.
 * 
 */
export class Missile extends Simulation {
    dragCoefficient = .25e-2;

    maxThrust = 1000;
    burnRate = 100;
    fuel = 100;

    sensorCone = 5 * Math.PI / 180;     /* Sensor head cone */
    maximumOmega = 3;                   /* How quickly the missile can be commanded to turn. */
    maximumBearing = 1;                 /* How much off boresight can the head turn. */
    commandMultiplier = 0.8;            /* How aggressive the command is. High values can cause instability. */
    headRateMultiplier = 0.1;           /* How quickly the missile head turns. High values can cause instability */   

    headBearing: number = 0;
    tone: number = 0;
    parent: string;
    commandedOmega: number = 0;

    armingTime: number = 500;           /* Time in milliseconds before the missile is armed */

    birthTime: number = Date.now();

    constructor(parent: string, uuid: string | undefined = undefined) {
        super(uuid);
        this.parent = parent;
        this.type = "missile";
    }

    integrate(dt: number, addTrail?: boolean): void {
        this.fuel -= this.burnRate * dt;

        /* Find the best target in front of the missile */
        let target = this.lockTarget();

        /* If there is a target, slew the head towards it and compute the required turn rate */
        if (target) {
            let azimuth = Math.atan2(target.y - this.y, target.x - this.x);
            let bearing = normalizeAngle(azimuth - this.track);

            let deltaBearing = this.commandMultiplier * bearing - this.headBearing;
            
            this.commandedOmega = deltaBearing / dt;
            if (this.commandedOmega > this.maximumOmega)
                this.commandedOmega = this.maximumOmega;
            else if (this.commandedOmega < -this.maximumOmega)
                this.commandedOmega = -this.maximumOmega;
            
            this.headBearing += this.headRateMultiplier * deltaBearing;
            if (this.headBearing > this.maximumBearing)
                this.headBearing = this.maximumBearing;
            else if (this.headBearing < -this.maximumBearing)
                this.headBearing = -this.maximumBearing;

            this.tone = target.getHeatSignature(this);
        } else {
            this.commandedOmega -= 0.1 * this.commandedOmega;
            this.tone = 0;
        }

        super.integrate(dt, addTrail);

        /* Expire the missile if it got too slow */
        if (this.v < 100) {
            Simulation.removeSimulation(this);
            console.log(`Missile ${this.uuid} expired`)

            /* Relay the expiration */
            if (this.parent === FightsOnCore.getOwnship().uuid) {
                FightsOnCore.sendMessage({ id: "remove", type: "missile", uuid: this.uuid });
            }
        }

        /* Send an update on the position of the missile to the server if we are the parent */
        if (this.parent === FightsOnCore.getOwnship().uuid) 
            FightsOnCore.sendMessage({ id: "update", type: "missile", parent: this.uuid, uuid: this.uuid, time: FightsOnCore.getClock().getTime(), state: this.getState() });

        /* Hit detection */
        if ((Date.now() - this.birthTime) > this.armingTime && computeDistance(FightsOnCore.getOwnship(), this) < 20) {
            FightsOnCore.getOwnship().life -= 50;
            FightsOnCore.sendMessage({ id: "remove", type: "missile", uuid: this.uuid });
            Simulation.removeSimulation(this);

            console.log(`Missile ${this.uuid} hit ownship`)
        }
    }

    /** Check if there is a valid target in front of the missile
     * 
     * @returns The target locked by the missile
     */
    lockTarget() {
        let bestTarget: Simulation | null = null;

        for (let target of Simulation.getAll()) {
            if (bestTarget === null || target.getHeatSignature(this) > bestTarget.getHeatSignature(this)) 
                bestTarget = target;
        }
        if (bestTarget !== null && Math.random() < bestTarget.getHeatSignature(this)) 
            return bestTarget;
        else 
            return null;
    }

    /** Compute the drag of the missile
     * 
     * @returns The drag of the missile
     */
    computeDrag(): number {
        /* Missiles have simple parasitic drag */
        return this.dragCoefficient * this.v * this.v; 
    }

    /** Compute the lift of the missile
     * 
     * @returns The lift of the missile
     */
    computeLift(): number {
        /* Compute the lift required to achieve the desired turn */
        let lift = this.commandedOmega * (this.v / 200);

        return lift;
    }

    /** Compute the thrust of the missile
     * 
     * @returns The thrust of the missile
     */
    computeThrust(): number {
        /* Provide thrust if motor is burning */
        return this.fuel > 0? this.maxThrust: 0;
    }

    /** Clamp the velocity of the missile 
     * 
     */
    clampVelocity(): void {
        // TODO
    }

    /** Get the state of the missile
     * 
     * @returns The state of the missile
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track,
            fuel: this.fuel
        }
    }

    /** Sets the state of the missile
     * 
     * @param state The state of the missile
     */
    setState(state: any) {
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
        this.fuel = state.fuel ?? this.fuel;
    }

    /** Draw the missile
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the missile
     * @param y Y position where to draw the missile
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Add the smoke */
        if (this.fuel > 0){
            let smokeTrack = this.track;
            let xSmoke = this.x - 10 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 5;
            let ySmoke = this.y - 10 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 5;
            
            new Smoke(xSmoke, ySmoke, 255, 255, 255);
        }

        /* Draw the missile */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.moveTo(-3, 0);
        ctx.lineTo(3, 0);
        ctx.stroke();
        ctx.restore();
    }

    /** Simple callback on removal, for effects
     * 
     */
    onRemoval(): void {
        new SmallExplosion(this.x, this.y);
    }

    /** Get the heat signature of the element
     * 
     * @param missile The missile "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(missile: Missile): number {
        return 0;
    }
}