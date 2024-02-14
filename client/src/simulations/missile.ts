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

    headBearing: number = 0;
    tone: number = 0;
    parent: string;
    commandedOmega: number = 0;

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
            let bearing = normalizeAngle(this.track - azimuth);

            let deltaBearing = this.headBearing - bearing;
            
            this.commandedOmega = deltaBearing / dt * 0.25;
            if (this.commandedOmega > 1)
                this.commandedOmega = 1;
            else if (this.commandedOmega < -1)
                this.commandedOmega = -1;
            this.headBearing = -bearing;
            if (this.headBearing > 1)
                this.headBearing = 1;
            else if (this.headBearing < -1)
                this.headBearing = -1;

            this.tone = target.getHeatSignature(this);
        } else {
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
        if (computeDistance(FightsOnCore.getOwnship(), this) < 10) {
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

        ctx.beginPath()
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.rotate(this.headBearing);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(20 + this.tone * 200, 0);
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