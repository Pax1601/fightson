import { Simulation } from "./simulation";

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
export function distance(sim1: Simulation, sim2: Simulation) {
    return Math.pow(sim1.x - sim2.x, 2) + Math.pow(sim1.y - sim2.y, 2); 
}

export function randomRgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ', 1)';
}