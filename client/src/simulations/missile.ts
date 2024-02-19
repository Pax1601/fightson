import { computeDistance, normalizeAngle } from "../utils/utils";
import { FightsOnCore } from "../core";
import { SmallExplosion } from "../renderer/effects/smallexplosion";
import { Smoke } from "../renderer/effects/smoke";
import { Simulation } from "./simulation";
import { IRSensor } from "../sensors/irsensor";

/** Missile simulation, extends the basic Simulation class.
 * 
 */
export class Missile extends Simulation {
    dragCoefficient = .1e-2;

    maxThrust = 1000;
    burnRate = 100;                     /* Missile burn rate, higher number means shorter burn */
    fuel = 100;                         /* Missile fuel, higher number means longer burn */

    maximumOmega = 3;                   /* How quickly the missile can be commanded to turn. */
    commandMultiplier = 10;             /* How aggressive the command is. High values can cause instability. */

    armingTime = 500;                   /* Time in milliseconds before the missile is armed */

    parent: string;
    commandedOmega: number = 0;

    birthTime: number = Date.now();

    irsensor: IRSensor = new IRSensor();

    constructor(parent: string, uuid: string | undefined = undefined) {
        super(uuid);
        this.parent = parent;
        this.type = "missile";
    }

    integrate(dt: number, addTrail?: boolean): void {
        this.fuel -= this.burnRate * dt;

        /* The sensor is attached to the missile head */
        this.irsensor.track = this.track;
        this.irsensor.x = this.x;
        this.irsensor.y = this.y;

        /* Find the best target in front of the missile */
        this.irsensor.lockTarget();

        /* If there is a target, slew the head towards it and compute the required turn rate */
        if (this.irsensor.lockedTarget) {
            /* Slew the head of the sensor to the target */
            let command = this.irsensor.slewHeadToTarget(dt);
            
            /* Command a rate proportional to the head rotation */
            this.commandedOmega = 0.9 * this.commandedOmega + 0.1 * this.commandMultiplier * command;
            if (this.commandedOmega > this.maximumOmega)
                this.commandedOmega = this.maximumOmega;
            else if (this.commandedOmega < -this.maximumOmega)
                this.commandedOmega = -this.maximumOmega;
        } else {
            this.commandedOmega -= 0.1 * this.commandedOmega;
        }

        super.integrate(dt, addTrail);

        /* Expire the missile if it got too old */
        if ((Date.now() - this.birthTime) > 30000) {
            Simulation.removeSimulation(this);
            console.log(`Missile ${this.uuid} expired`)

            /* Relay the expiration */
            if (this.parent === FightsOnCore.getOwnship().uuid) {
                FightsOnCore.sendMessage({ id: "remove", type: "missile", uuid: this.uuid });
            }
        }

        /* Send an update on the position of the missile to the server if we are the parent */
        if (this.parent === FightsOnCore.getOwnship().uuid) 
            FightsOnCore.sendMessage({ id: "update", type: "missile", parent: this.uuid, uuid: this.uuid, time: FightsOnCore.getClock().getTime(), state: this.getState(), ssc: ++this.ssc });

        /* Hit detection */
        if ((Date.now() - this.birthTime) > this.armingTime && computeDistance(FightsOnCore.getOwnship(), this) < 20) {
            FightsOnCore.getOwnship().life -= 50;
            FightsOnCore.sendMessage({ id: "remove", type: "missile", uuid: this.uuid });
            Simulation.removeSimulation(this);

            console.log(`Missile ${this.uuid} hit ownship`)
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
        /* Compute the lift required to achieve the desired turn */
        let lift = this.commandedOmega * (this.v / 200);

        return lift;
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
            track: this.track,
            fuel: this.fuel,
            headBearing: this.irsensor.headBearing
        }
    }

    /** Sets the state of the missile
     * 
     * @param state The state of the missile
     */
    setState(state: any) {
        this.x = state.x ?? this.x;
        this.y = state.y ?? this.y;
        this.v = state.v ?? this.v;
        this.track = state.track ?? this.track;
        this.fuel = state.fuel ?? this.fuel;
        this.irsensor.headBearing = state.headBearing ?? this.irsensor.headBearing;
    }

    /** Draw the missile
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the missile
     * @param y Y position where to draw the missile
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Add the smoke */
        if (this.fuel > 0){
            let smokeTrack = this.track;
            let xSmoke = this.x - 10 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 5;
            let ySmoke = this.y - 10 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 5;
            
            new Smoke(xSmoke, ySmoke, 255, 255, 255);
        }

        /* Draw the missile */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.moveTo(-3, 0);
        ctx.lineTo(3, 0);
        ctx.stroke();
        ctx.restore();

        /* Draw a lock symbol on the locked target, if present */
        if (this.irsensor.lockedTarget) {
            ctx.save();
            ctx.translate(this.irsensor.lockedTarget.x, this.irsensor.lockedTarget.y);
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
        }

        /* For debugging, draw the sensor head direction */
        if (FightsOnCore.debug) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.irsensor.track);
            ctx.rotate(this.irsensor.headBearing);
            ctx.strokeStyle = "red";

            ctx.rotate(this.irsensor.sensorCone);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1000, 0);
            ctx.stroke();

            ctx.rotate(-2 * this.irsensor.sensorCone);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1000, 0);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    /** Simple callback on removal, for effects
     * 
     */
    onRemoval(): void {
        new SmallExplosion(this.x, this.y);
    }

    /** Get the heat signature of the element
     * 
     * @param sensor The sensor "looking" at the element
     * @returns Heat signature
     */
    getHeatSignature(sensor: IRSensor): number {
        return 0;
    }
}