import { normalizeAngle } from "./utils";

/** Abstract class representing a generic simulation entity
 * 
 */
export abstract class Simulation {
    x: number = 0;
    y: number = 0;
    track: number = 0;
    v: number = 0;

    omega: number = 0;

    trail: {x: number, y: number}[] = [];

    constructor() {
    }

    /** Integrate the simulation forward by a fixed time delta
     * 
     * @param dt The time delta in seconds
     * @param addTrail Boolean, check if the current integration should add an entry in the trail
     */
    integrate(dt: number, addTrail = true) {
        /* Change the velocity depending on acceleration */
        this.v += (this.computeThrust() - this.computeDrag()) * dt;

        /* Clamp the velocity if necessary */
        this.clampVelocity();

        /* Turn depending on lift */
        this.omega = this.computeLift() / (this.v / 200);
        this.track = normalizeAngle(this.track + this.omega * dt);      

        /* Project velocity on cartesian axes */
        let vx = this.v * Math.cos(this.track); 
        let vy = this.v * Math.sin(this.track); 

        /* Integrate position depending on velocity */
        this.x += vx * dt;
        this.y += vy * dt;

        /* Add position to trail */
        if (addTrail) {
            this.trail.push({x: this.x, y: this.y});
            this.trail = this.trail.slice(-350);
        }
    }

    /* Abstract methods that have to be implemented by child classes */
    abstract computeLift(): number;
    abstract computeDrag(): number;
    abstract computeThrust(): number;
    abstract clampVelocity(): void;
    abstract getState(): object;
    abstract setState(state: object): void;
}