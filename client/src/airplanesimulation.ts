import { Inputs } from "./core";
import { Simulation } from "./simulation";

/** Airplane simulation. Extends the basic Simulation class 
 *  
 */
export class AirplaneSimulation extends Simulation {
    /* Default parameters */
    maxThrust = 100;
    liftCoefficient = 2;
    dragCoefficient = 1e-3;
    efficiency = 0.25;
    minSpeed = 50;
    maxAngleOfAttack = 0.8;
    stalled = false;
    life = 100;

    /* Airplane specific controls */
    throttlePosition: number = 0.5;
    angleOfAttack: number = 0;

    /* Default speed at spawn */
    v: number = 100;

    /* Airplane inputs */
    inputs = {
        'up': false,
        'down': false,
        'left': false,
        'right': false,
        'gun': false
    };

    /* Boolean to represent if this is the airplane controlled by the client */
    ownship: boolean;

    constructor(ownship: boolean = false) {
        super();
        this.ownship = ownship;
    }

    /** Integrate the simulation forward
     * 
     * @param dt Delta time, in seconds
     */
    integrate(dt: number, addTrail: boolean = true) {
        /* Change the angle of attack depending on the user input */
        if (this.inputs['left'])
            this.angleOfAttack = Math.max(-1, this.angleOfAttack - dt);
        else if (this.inputs['right'])
            this.angleOfAttack = Math.min(1, this.angleOfAttack + dt);    

        /* Change the throttle position depending on the user input */
        if (this.inputs['down'])
            this.throttlePosition = Math.max(-0.3, this.throttlePosition - dt);
        else if (this.inputs['up'])
            this.throttlePosition = Math.min(1, this.throttlePosition + dt);  
            
        super.integrate(dt, addTrail);
    }

    /** Set the inputs
     * 
     * @param inputs Inputs structure
     */
    setInputs(inputs: Inputs) {
        this.inputs = inputs;
    }

    /** Compute the lift of the airplane
     * 
     * @returns The lift of the airplane
     */
    computeLift() {
        /* Below stall, lift increases linearly */
        if (Math.abs(this.angleOfAttack) < this.maxAngleOfAttack) {
            this.stalled = false;
            return (this.v / 200 * this.v / 200) * this.liftCoefficient * Math.abs(this.angleOfAttack) * Math.sign(this.angleOfAttack);
        }
        /* After stall lift drops quickly */
        else {
            this.stalled = true;
            return (this.v / 200 * this.v / 200) * this.maxAngleOfAttack * this.liftCoefficient * (1 + (this.maxAngleOfAttack - Math.abs(this.angleOfAttack)) / this.maxAngleOfAttack * 2) * Math.sign(this.angleOfAttack);
        }
    }
    /** Compute the airplane drag
     * 
     * @returns The drag of the airplane
     */
    computeDrag() {
        /* Drag increases with the sqare of speed, and has a constant and induced part, which in turns increases with the square of angle of attack */
        return this.dragCoefficient * this.v * this.v * (1 + 1 / this.efficiency * this.angleOfAttack * this.angleOfAttack); 
    }

    /** Compute the airplane thrust
     * 
     * @returns The thrust of the airplane
     */
    computeThrust() {
        /* Thrust increases linearly with throttle */
        return this.maxThrust * this.throttlePosition * (1 + 0.8 * this.v / 360);
    }

    /** Clamps the velocity to a minimum value
     * 
     */
    clampVelocity() {
        if (this.v < this.minSpeed)
            this.v = this.minSpeed;
    }

    /** Gets the current state of the airplane
     * 
     * @returns The state of the airplane
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            v: this.v,
            track: this.track,
            angleOfAttack: this.angleOfAttack,
            throttlePosition: this.throttlePosition
        }
    }

    /** Sets the state of the airplane
     * 
     * @param state The state of the airplane
     */
    setState(state: any) {
        this.x = state.x;
        this.y = state.y;
        this.v = state.v;
        this.track = state.track;
        this.angleOfAttack = state.angleOfAttack;
        this.throttlePosition = state.throttlePosition;
    }
}