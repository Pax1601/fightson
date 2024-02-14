import { nanoid } from "nanoid";
import { normalizeAngle } from "../utils/utils";

/** Abstract class representing a generic simulation entity
 * 
 */
export abstract class Simulation {
    uuid: string = "";
    x: number = 0;
    y: number = 0;
    track: number = 0;
    v: number = 0;

    omega: number = 0;

    trail: { x: number, y: number }[] = [];

    /* Static members and methods */
    static simulations: Simulation[] = [];

    /** Add a new simulation element
     * 
     * @param simulation Simulation element to register
     */
    static addSimulation(simulation: Simulation) {
        Simulation.simulations.push(simulation);
    }

    /** Remove a simulation element
     * 
     * @param simulation Simulation element to register
     */
    static removeSimulation(simulation: Simulation) {
        Simulation.simulations = Simulation.simulations.filter((existingSimulation) => { return existingSimulation === simulation; });
    }

    /** Returns a simulation element by uuid
     * 
     * @param uuid Uuid to search for
     * @returns If found, the simulation element
     */
    static getByUUID(uuid: string) {
        return Simulation.simulations.find((simulation) => {return simulation.uuid === uuid;})
    }

    /** Returns all the simulations of a certain type
     * 
     * @param type Type to search for
     * @returns Array of simulation elements
     */
    static getAllByType(type: string) {
        return Simulation.simulations.filter((simulation) => {return typeof simulation === type});
    }

    constructor(uuid: string | undefined = undefined) {
        Simulation.addSimulation(this);
        if (uuid)
            this.uuid = uuid;
        else
            this.uuid = nanoid(10);
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
            this.trail.push({ x: this.x, y: this.y });
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