import { FightsOnCore } from "../core";
import { IRSensor } from "../sensors/irsensor";
import { computeDistance } from "../utils/utils";
import { Simulation } from "./simulation";

/** Bullet simulation, extends the basic Simulation class.
 * 
 */
export class Bullet extends Simulation {
    dragCoefficient = .25e-2;

    v: number = 500;

    constructor(uuid: string | undefined = undefined) {
        super(uuid);

        this.type = "bullet";
    }

    /** Integrate the simulation forward by a fixed time delta
     * 
     * @param dt The time delta in seconds
     * @param addTrail Boolean, check if the current integration should add an entry in the trail
     */
    integrate(dt: number, addTrail?: boolean): void {
        super.integrate(dt);

        /* Remove any bullet that got too slow. */
        if (this.v < 250)
            Simulation.removeSimulation(this);

        /* Hit detection */
        if (computeDistance(FightsOnCore.getOwnship(), this) < 10) {
            FightsOnCore.getOwnship().life -= 10;
        }
    }

    /** Compute the drag of the bullet
     * 
     * @returns The drag of the bullet
     */
    computeDrag(): number {
        /* Bullets have simple parasitic drag */
        return this.dragCoefficient * this.v * this.v; 
    }

    /** Compute the lift of the bullet
     * 
     * @returns The lift of the bullet
     */
    computeLift(): number {
        /* Bullets have no lift */
        return 0;
    }

    /** Compute the thrust of the bullet
     * 
     * @returns The thrust of the bullet
     */
    computeThrust(): number {
        /* Bullets have no thrust */
        return 0;
    }

    /** Clamp the velocity of the bullet 
     * 
     */
    clampVelocity(): void {
        // TODO
    }

    /** Get the state of the bullet
     * 
     * @returns The state of the bullet
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track
        }
    }

    /** Sets the state of the bullet
     * 
     * @param state The state of the bullet
     */
    setState(state: any) {
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
    }

     /** Draw the bullet
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the bullet
     * @param y Y position where to draw the bullet
     */
     draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the bullet */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "yellow";
        ctx.moveTo(-2, 0);
        ctx.lineTo(2, 0);
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
     * @param sensor The sensor "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(sensor: IRSensor): number {
        return 0;
    }
}