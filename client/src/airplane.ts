import { AirplaneSimulation } from "./airplanesimulation";
import { randomRgba } from "./utils";

/** Airplane class. Extends the AirplaneSimulation class to separate the simulation from the rendering.
 * 
 */
export class Airplane extends AirplaneSimulation {
    img: HTMLImageElement = new Image();
    trailColor = randomRgba();

    src = "client/img/airplanes/debug" //TODO: confiburable path
    
    constructor(ownship: boolean = false) {
        super(ownship);
        this.img.src = `${this.src}/top.png`; 
    }

    /** Draw the airplane
     * 
     * @param ctx Canvas Rendering Context. 
     */
    draw(ctx: CanvasRenderingContext2D) {
        /* Draw the trail */
        ctx.beginPath();
        ctx.strokeStyle = this.trailColor;
        ctx.moveTo(this.trail[0].x, this.trail[0].y);

        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();

        /* Draw the airplane */
        if (this.angleOfBank < -0.3) 
            this.img.src = `${this.src}/left.png`;
        else if (this.angleOfBank > 0.3) 
            this.img.src = `${this.src}/right.png`;
        else
            this.img.src = `${this.src}/top.png`;

        ctx.save();
        let xBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        let yBuffet = (Math.random() - 0.5) * 5 * this.angleOfAttack * this.angleOfAttack;
        ctx.translate(this.x + xBuffet, this.y + yBuffet);
        ctx.rotate(this.track + 0.25 * this.angleOfAttack * this.angleOfBank);
        ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        ctx.restore();
    }
}