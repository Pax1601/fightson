import { Smoke } from "../renderer/effects/smoke";
import { computeDistance, normalizeAngle } from "../utils/utils";
import { Missile } from "./missile";
import { Simulation } from "./simulation";

/** Debris simulation, extends the basic Simulation class.
 * 
 */
export class ExplosionDebris extends Simulation {
    dragCoefficient = 0.5e-1;

    v: number = 0;

    smokeCooldown: number = 0;

    constructor(uuid: string | undefined = undefined) {
        super(uuid);

        this.type = "debris";
    }

    /** Integrate the simulation forward by a fixed time delta
     * 
     * @param dt The time delta in seconds
     * @param addTrail Boolean, check if the current integration should add an entry in the trail
     */
    integrate(dt: number, addTrail?: boolean): void {
        super.integrate(dt);

        let smokeTrack = this.track;
        let xSmoke = this.x - 2 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 2;
        let ySmoke = this.y - 2 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 2;

        if (this.smokeCooldown <= 0) {
            let size = Math.random() * 5;
            new Smoke(xSmoke, ySmoke, 0, 0, 0, size, size + Math.random() * 5, 5);
            this.smokeCooldown = 200 / this.v;  /* Decrease the smoke puffs with velocity, for efficiency */
        }
        else {
            this.smokeCooldown--;
        }

        /* Remove any debris that got too slow. */
        if (this.v < 5)
            Simulation.removeSimulation(this);
    }

    /** Compute the drag of the debris
     * 
     * @returns The drag of the debris
     */
    computeDrag(): number {
        /* Debriss have simple parasitic drag */
        return this.dragCoefficient * this.v * this.v; 
    }

    /** Compute the lift of the debris
     * 
     * @returns The lift of the debris
     */
    computeLift(): number {
        /* Debriss have no lift */
        return 0;
    }

    /** Compute the thrust of the debris
     * 
     * @returns The thrust of the debris
     */
    computeThrust(): number {
        /* Debriss have no thrust */
        return 0;
    }

    /** Clamp the velocity of the debris 
     * 
     */
    clampVelocity(): void {

    }

    /** Get the state of the debris
     * 
     * @returns The state of the debris
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track
        }
    }

    /** Sets the state of the debris
     * 
     * @param state The state of the debris
     */
    setState(state: any) {
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
    }

     /** Draw the debris
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the debris
     * @param y Y position where to draw the debris
     */
     draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the debris */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.moveTo(-1, 0);
        ctx.lineTo(1, 0);
        ctx.stroke();
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
        /* Debries have no heat signature */
        return 0;
    }
}