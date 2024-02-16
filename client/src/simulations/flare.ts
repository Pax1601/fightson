import { Smoke } from "../renderer/effects/smoke";
import { IRSensor } from "../sensors/irsensor";
import { computeSensorDistance, normalizeAngle } from "../utils/utils";
import { Simulation } from "./simulation";

/** Flare simulation, extends the basic Simulation class.
 * 
 */
export class Flare extends Simulation {
    dragCoefficient = 0.5e-1;

    v: number = 0;

    smokeCooldown: number = 0;

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

        let smokeTrack = this.track;
        let xSmoke = this.x - 2 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 2;
        let ySmoke = this.y - 2 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 2;

        if (this.smokeCooldown <= 0) {
            new Smoke(xSmoke, ySmoke, 255, 255, 255, 1, 2, 5);
            this.smokeCooldown = 200 / this.v;  /* Decrease the smoke puffs with velocity, for efficiency */
        }
        else {
            this.smokeCooldown--;
        }

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
     * @param sensor The sensor "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(sensor: IRSensor): number {
        /* Compute distance and bearing */
        let azimuth = Math.atan2(this.y - sensor.y, this.x - sensor.x);
        let bearing = normalizeAngle(azimuth - sensor.track);
        let distance = computeSensorDistance(this, sensor);

        /* This is how far away the airplane is from the center of the missile head FOV */
        let deltaBearing = sensor.headBearing - bearing;

        /* Compute the heat signature */
        const baseSignature = 1.5;

        /* Distance multiplier. Being closer than 500 px casuses the multiplier to be greater than 1 */
        const distanceMultiplier = Math.min(1.5, Math.pow(500 / distance, 2));

        /* Multiplier due to bearing difference. Looking directly at the airplanes causes the multiplier to be greater than 1. It falls off very quickly outside of a narrow cone */
        let deltaBearingMultiplier = 0;
        if (Math.abs(deltaBearing) < sensor.sensorCone) {
            deltaBearingMultiplier = 1.0;
        } else {
            deltaBearingMultiplier = Math.max(0, 1 - Math.abs(deltaBearing - sensor.sensorCone) / sensor.sensorCone);
        }

        return baseSignature * distanceMultiplier * deltaBearingMultiplier;
    }
}