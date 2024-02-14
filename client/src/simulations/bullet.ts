import { BulletSimulation } from "./bulletsimulation";

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
     * @param x X position where to draw the bullet
     * @param y Y position where to draw the bullet
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        /* Draw the bullet */
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.track);
        ctx.beginPath()
        ctx.strokeStyle = "yellow";
        ctx.moveTo(-2, 0);
        ctx.lineTo(2, 0);
        ctx.stroke();
        ctx.restore();
    }
}