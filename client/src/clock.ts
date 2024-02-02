export class Clock {
    deltaSamples: number[] = [];
    delta: number = 0;

    constructor() {

    }

    addDeltaSample(sample: number) {
        this.deltaSamples.push(sample);

        this.delta = 0;
        for (let deltaSample of this.deltaSamples) {
            this.delta += deltaSample / this.deltaSamples.length;
        }
    }

    getTime() {
        return Date.now() + this.delta;
    }
}