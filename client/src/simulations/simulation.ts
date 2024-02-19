import { nanoid } from "nanoid";
import { normalizeAngle } from "../utils/utils";
import { IRSensor } from "../sensors/irsensor";

/** Abstract class representing a generic simulation entity
 * 
 */
export abstract class Simulation {
    type: string = "";
    uuid: string = "";
    x: number = 0;
    y: number = 0;
    track: number = 0;
    v: number = 0;

    omega: number = 0;

    trail: { x: number, y: number }[] = [];
    ssc: number = 0;        /* Sequence counter for update messages */

    /* Static members and methods */
    static simulations: Simulation[] = [];
    static removedUuids: string[] = [];

    /** Add a new simulation element
     * 
     * @param simulation Simulation element to register
     */
    static addSimulation(simulation: Simulation) {
        /* Check that the simulation had not been previously removed already */
        if (!Simulation.simulations.includes(simulation) && !Simulation.removedUuids.includes(simulation.uuid)) {
            Simulation.simulations.push(simulation);
        }
    }

    /** Remove a simulation element
     * 
     * @param simulation Simulation element to register
     * @param quiet If true, onRemoval will not be called (usual not to play removal animation)
     * @param permanent If true, the simulation can not be readded
     */
    static removeSimulation(simulation: Simulation, quiet: boolean = false, permanent: boolean = true) {
        if (Simulation.simulations.includes(simulation)){ 
            Simulation.simulations = Simulation.simulations.filter((existingSimulation) => { return existingSimulation !== simulation; });

            /* Permanently removed objects are added to the list and can't be readded */
            if (permanent)
                Simulation.removedUuids.push(simulation.uuid);

            if (!quiet) {
                simulation.onRemoval();
            }
        }
    }

    /** Returns a simulation element by uuid
     * 
     * @param uuid Uuid to search for
     * @returns If found, the simulation element
     */
    static getByUUID(uuid: string) {
        return Simulation.simulations.find((simulation) => {return simulation.uuid === uuid;})
    }

    /** Returns all the simulations 
     * 
     * @returns Array of simulation elements
     */
    static getAll() {
        return Simulation.simulations;
    }

    /** Returns all the simulations of a certain type
     * 
     * @param type Type to search for
     * @returns Array of simulation elements
     */
    static getAllByType(type: string) {
        return Simulation.simulations.filter((simulation) => {return simulation.type === type});
    }

    constructor(uuid: string | undefined = undefined) {
        if (uuid)
            this.uuid = uuid;
        else
            this.uuid = nanoid(10);

        Simulation.addSimulation(this);
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
    abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, dt: number): void;
    abstract onRemoval(): void;
    abstract getHeatSignature(sensor: IRSensor): number;
}