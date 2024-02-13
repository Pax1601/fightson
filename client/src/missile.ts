import { MissileSimulation } from "./missilesimulation";
import { Smoke } from "./smoke";
import { nanoid } from 'nanoid';

/** Missile class. Extends the MissileSimulation class to separate the simulation from the rendering.
 * 
 */
export class Missile extends MissileSimulation {
    smokes: Smoke[] = [];
    parent: string;
    uuid: string;
    exploded: boolean = false;

    constructor(parent: string, uuid: string | undefined = undefined) {
        super();
        this.parent = parent;
        if (uuid)
            this.uuid = uuid;
        else
            this.uuid = nanoid(10);
    }

    /** Draw the missile
     * 
     * @param ctx Canvas Rendering Context.
     */
    draw(ctx: CanvasRenderingContext2D) {
        /* Draw the missile */
        if (!this.exploded) {
            ctx.save();
            ctx.translate(this.x, this.y);
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