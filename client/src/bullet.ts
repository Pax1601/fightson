import { BulletSimulation } from "./bulletsimulations";

/** Bullet class. Extends the BulletSimulation class to separate the simulation from the rendering.
 * 
 */
export class Bullet extends BulletSimulation {

    constructor() {
        super();
    }

    /** Draw the bullet
     * 
     * @param ctx Canvas Rendering Context.
     */
    draw(ctx: CanvasRenderingContext2D) {
        /* Draw the bullet */
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "yellow";
        ctx.moveTo(-2, 0);
        ctx.lineTo(2, 0);
        ctx.stroke();
        ctx.restore();
    }
}