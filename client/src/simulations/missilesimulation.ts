import { Airplane } from "./airplane";
import { normalizeAngle } from "../utils/utils";
import { GraphicalSimulation } from "./graphicalsimulation";
import { AirplaneSimulation } from "./airplanesimulation";
import { Simulation } from "./simulation";

/** Missile simulation, extends the basic GraphicalSimulation class.
 * 
 */
export abstract class MissileSimulation extends GraphicalSimulation {
    dragCoefficient = .25e-2;

    maxThrust = 1000;
    burnRate = 100;
    fuel = 100;

    lockedTarget: Airplane | null = null;
    exploded: boolean = false;

    constructor(uuid: string | undefined = undefined) {
        super(uuid);
    }

    integrate(dt: number, addTrail?: boolean): void {
        this.fuel -= this.burnRate * dt;

        /* Simple pure pursuit, TODO collision */
        if (this.lockedTarget) {
            this.track = Math.atan2(this.lockedTarget.y - this.y, this.lockedTarget.x - this.x);
        }

        super.integrate(dt, addTrail);

        if (this.v < 50)
            this.exploded = true;


        /* Send an update on the position of the missile to the server if we are the parent */
        // TODO
        if (missile.parent === this.uuid) 
            this.webSocket.send(JSON.stringify({ id: "update", type: "missile", parent: this.uuid, uuid: missile.uuid, time: this.clock.getTime(), state: missile.getState() }));
    }

    /** Check if there is a valid target in front of the missile
     * 
     * @param airplanes 
     */
    lockTarget(airplanes: Airplane[]) {
        for (let airplane of airplanes) {
            let azimuth = Math.atan2(airplane.y - this.y, airplane.x - this.x);
            let bearing = normalizeAngle(this.track - azimuth);
            let range = Math.sqrt(Math.pow(airplane.x - this.x, 2) + Math.pow(airplane.y - this.y, 2));
            if (Math.abs(bearing) < 1 && range < 1000) {
                this.lockedTarget = airplane;
            }
        }
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
        /* Missiles have no lift */
        return 0;
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
            track: this.track
        }
    }

    /** Sets the state of the missile
     * 
     * @param state The state of the missile
     */
    setState(state: any) {
        this.x = state.x;
        this.y = state.y;
        this.v = state.v;
        this.track = state.track
    }
}