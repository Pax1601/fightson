import { Simulation } from "../simulations/simulation";
import { normalizeAngle } from "../utils/utils";
import { Sensor } from "./sensor";

export class IRSensor extends Sensor {
    sensorCone = 5 * Math.PI / 180;     /* Sensor head cone */
    maximumBearing = 1;                 /* How much off boresight can the head turn. */
    headRateMultiplier = 0.25;          /* How quickly the sensor head turns. High values can cause instability */   

    headBearing: number = 0;
    tone: number = 0;
    lockedTarget: Simulation | null = null;

    /** Slew the sensor head to the target
     * 
     * @param dt Time step, in seconds
     * @returns The amount the sensor head turned
     */
    slewHeadToTarget(dt: number) {
        if (this.lockedTarget !== null) {
            /* Compute the angular difference between the sensor head bearing and the target bearing */
            let azimuth = Math.atan2(this.lockedTarget.y - this.y, this.lockedTarget.x - this.x);
            let bearing = normalizeAngle(azimuth - this.track);
            let deltaBearing = bearing - this.headBearing;

            /* Turn the head towards the target */
            let command = this.headRateMultiplier * deltaBearing / dt;
            this.headBearing += command * dt;

            /* Apply gimbal limits */
            if (this.headBearing > this.maximumBearing)
                this.headBearing = this.maximumBearing;
            else if (this.headBearing < -this.maximumBearing)
                this.headBearing = -this.maximumBearing;

            return command;
        } 
        return 0;
    }

    /** Check if there is a valid target in front of the missile and lock it
     * 
     */
    lockTarget() {
        let bestTarget: Simulation | null = null;

        for (let target of Simulation.getAll()) {
            if (bestTarget === null || target.getHeatSignature(this) > bestTarget.getHeatSignature(this)) 
                bestTarget = target;
        }
        if (bestTarget !== null && Math.random() < bestTarget.getHeatSignature(this)) {
            this.tone = bestTarget.getHeatSignature(this);
            this.lockedTarget = bestTarget;
        }
        else 
        {
            this.tone -= 0.1;
            this.lockedTarget = null;
        }
    }
}