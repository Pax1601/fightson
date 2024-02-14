/** This class implements a simple Clock. It will return the local time compensated with a fixed delta to try and
 * synchronize it with the server time in order to provide a shared time reference between all clients.
 * 
 */
export class Clock {
    deltaSamples: number[] = [];
    delta: number = 0;

    constructor() {

    }

    /** Add a new sample to compute the delta time.
     * 
     * @param sample The time sample to add
     */
    addDeltaSample(sample: number) {
        this.deltaSamples.push(sample);

        /* Compute the average value between the samples */
        this.delta = 0;
        for (let deltaSample of this.deltaSamples) {
            this.delta += deltaSample / this.deltaSamples.length;
        }
    }

    /** Get the current server time
     * 
     * @returns The server time
     */
    getTime() {
        return Date.now() + this.delta;
    }
}