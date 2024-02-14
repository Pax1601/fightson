import { GraphicalSimulation } from "./graphicalsimulation";
import { Simulation } from "./simulation";

/** Bullet simulation, extends the basic GraphicalSimulation class.
 * 
 */
export abstract class BulletSimulation extends GraphicalSimulation {
    dragCoefficient = .25e-2;

    v: number = 500;

    constructor() {
        super();
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
        this.x = state.x;
        this.y = state.y;
        this.v = state.v;
        this.track = state.track
    }
}