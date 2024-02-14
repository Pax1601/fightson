import { MissileSimulation } from "./missilesimulation";
import { Smoke } from "../renderer/effects/smoke";
import { nanoid } from 'nanoid';

/** Missile class. Extends the MissileSimulation class to separate the simulation from the rendering.
 * 
 */
export class Missile extends MissileSimulation {
    smokes: Smoke[] = [];
    parent: string;

    constructor(parent: string, uuid: string | undefined = undefined) {
        super(uuid);
        this.parent = parent;
    }

    /** Draw the missile
     * 
     * @param ctx Canvas Rendering Context.
     * @param x X position where to draw the missile
     * @param y Y position where to draw the missile
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the missile */
        if (!this.exploded) {
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
        }

        /* Draw the smoke */
        if (this.fuel > 0){
            let smokeTrack = this.track;
            let xSmoke = this.x - 10 * Math.cos(smokeTrack) + (Math.random() - 0.5) * 5;
            let ySmoke = this.y - 10 * Math.sin(smokeTrack) + (Math.random() - 0.5) * 5;
            
            this.smokes.push(new Smoke(xSmoke, ySmoke, 255, 255, 255));
        }
        this.smokes = this.smokes.filter((smoke) => {return !smoke.expired();}); 
        for (let smoke of this.smokes) {
            smoke.draw(ctx);
        }
    }
}