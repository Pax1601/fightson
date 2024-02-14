import { Effect } from "./effect";

export class SmallExplosion extends Effect{
    initialRadius: number = 2;
    finalRadius: number = 5;
    birthTime: number = Date.now();

    constructor(x: number, y: number) {
        super(x, y);

        this.x = x;
        this.y = y;
    }

    /** Draw the effect
     * 
     * @param ctx Canvas Rendering Context. 
     * @param x X coordinate position where the effect must be drawn
     * @param y Y coordinate position where the effect must be drawn
     * @param dt Time since last frame, in seconds
     */
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, dt: number) {
        this.checkExpired();

        ctx.save();
        ctx.filter = "blur(2px)";
        ctx.fillStyle = `orange`;
        ctx.strokeStyle = `orange`;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = `white`;
        ctx.strokeStyle = `white`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    /** Check is the smoke should be removed
     * 
     * @returns True if smoke is expired
     */
    checkExpired() {
        let aliveTime = Date.now() - this.birthTime;
        if (aliveTime > 200) {
            Effect.removeEffect(this);
            return true;
        }
        return false;
    }
}