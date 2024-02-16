import { Sensor } from "../sensors/sensor";
import { Simulation } from "../simulations/simulation";

/** Asynchronous sleep function
 * 
 * @param ms Time to sleep in milliseconds
 * @returns Promise which will fullfill after the desired milliseconds time
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Computes distance between two simulation entities
 * 
 * @param sim1 Entity 1
 * @param sim2 Entity 2
 * @returns Distance between the entities
 */
export function computeDistance(sim1: Simulation, sim2: Simulation) {
    return Math.sqrt(Math.pow(sim1.x - sim2.x, 2) + Math.pow(sim1.y - sim2.y, 2)); 
}

/** Computes distance between a simulation and a sensor
 * 
 * @param sim Entity 1
 * @param sensor Entity 2
 * @returns Distance between the entities
 */
export function computeSensorDistance(sim: Simulation, sensor: Sensor) {
    return Math.sqrt(Math.pow(sim.x - sensor.x, 2) + Math.pow(sim.y - sensor.y, 2)); 
}

/** Return a random rgba string
 * 
 * @returns Random rgba string
 */
export function randomRgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ', 1)';
}

/** Normalize angle between -PI to +PI
 * 
 * @param angle Angle to normalize
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number) {
    while (angle > Math.PI) {
        angle -= 2 * Math.PI;
    }
    while (angle < -Math.PI) {
        angle += 2 * Math.PI;
    }
    return angle;
}

/** Converts a color hex string to rgba
 * 
 * @param hex Color in hex
 * @param alpha Optional alpha value
 * @returns rgba string
 */
export function hexToRGB(hex: string, alpha: number | undefined = undefined) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}