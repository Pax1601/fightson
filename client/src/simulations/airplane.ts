import { AirplaneSimulation } from "./airplanesimulation";
import { Smoke } from "../renderer/effects/smoke";
import { randomRgba } from "../utils/utils";
import { nanoid } from "nanoid";

/** Airplane class. Extends the AirplaneSimulation class to separate the simulation from the rendering.
 * 
 */
export class Airplane extends AirplaneSimulation {
    img: HTMLImageElement = new Image();
    trailColor = randomRgba();
    username = "";
    smokes: Smoke[] = [];

    src = "client/img/airplanes/debug" //TODO: confiburable path
    
    constructor(uuid: string | undefined = undefined, ownship: boolean = true, username: string = "") {
        super(uuid, ownship);
        this.img.src = `${this.src}/top.png`; 
        this.username = username;
    }

    /** Draw the airplane
     * 
     * @param ctx Canvas Rendering Context. 
     * @param x X coordinate position where the airplane must be drawn
     * @param y Y coordinate position where the airplane must be drawn
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the trail */
        ctx.beginPath();
        ctx.strokeStyle = this.trailColor;
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();

        /* Draw the smoke */
        if (this.life < 70 && Math.random() < 0.8){
            let smokeTrack = this.track + 0.25 * this.angleOfAttack * Math.sign(this.angleOfBank) + (Math.random() - 0.5) * 0.05;
            let xSmoke = this.x - 10 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 5;
            let ySmoke = this.y - 10 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 5;
            
            this.smokes.push(new Smoke(xSmoke, ySmoke, this.life * 255 / 100, this.life * 255 / 100, this.life * 255 / 100));
        }
        this.smokes = this.smokes.filter((smoke) => {return !smoke.expired();}); 
        for (let smoke of this.smokes) {
            smoke.draw(ctx);
        }

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
        ctx.translate(x + xBuffet, y + yBuffet);
        ctx.rotate(this.track + 0.25 * this.angleOfAttack * this.angleOfBank);
        ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        ctx.restore();

        /* Draw the name */
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#FFFA";
        ctx.font = "14px Open Sans";
        ctx.textAlign = "center";
        ctx.fillText(this.username.substring(0, 10) + (this.username.length > 10? "...": ""), 0, -25);

        ctx.restore();
    }
}