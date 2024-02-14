import { FightsOnCore } from "../core";
import { computeDistance } from "../utils/utils";
import { Missile } from "./missile";
import { Simulation } from "./simulation";

/** Flare simulation, extends the basic Simulation class.
 * 
 */
export class Flare extends Simulation {
    dragCoefficient = 1e-1;

    v: number = 0;

    constructor(uuid: string | undefined = undefined) {
        super(uuid);

        this.type = "flare";
    }

    /** Integrate the simulation forward by a fixed time delta
     * 
     * @param dt The time delta in seconds
     * @param addTrail Boolean, check if the current integration should add an entry in the trail
     */
    integrate(dt: number, addTrail?: boolean): void {
        super.integrate(dt);

        /* Remove any flare that got too slow. */
        if (this.v < 5)
            Simulation.removeSimulation(this);
    }

    /** Compute the drag of the flare
     * 
     * @returns The drag of the flare
     */
    computeDrag(): number {
        /* Flares have simple parasitic drag */
        return this.dragCoefficient * this.v * this.v; 
    }

    /** Compute the lift of the flare
     * 
     * @returns The lift of the flare
     */
    computeLift(): number {
        /* Flares have no lift */
        return 0;
    }

    /** Compute the thrust of the flare
     * 
     * @returns The thrust of the flare
     */
    computeThrust(): number {
        /* Flares have no thrust */
        return 0;
    }

    /** Clamp the velocity of the flare 
     * 
     */
    clampVelocity(): void {

    }

    /** Get the state of the flare
     * 
     * @returns The state of the flare
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track
        }
    }

    /** Sets the state of the flare
     * 
     * @param state The state of the flare
     */
    setState(state: any) {
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
    }

     /** Draw the flare
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the flare
     * @param y Y position where to draw the flare
     */
     draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the trail */
        let count = 0;
        if (this.trail.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${count / this.trail.length})`;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
                count++;
            }
            
        }

        /* Draw the flare */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "yellow";
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
        /* Flares have a constant heat signature */
        return 0.5;
    }
}