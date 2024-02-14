import { Effect } from "./effect";

export class Smoke extends Effect{
    r: number;
    g: number;
    b: number;
    initialRadius: number = 2;
    finalRadius: number = 5;
    radius: number;

    constructor(x: number, y: number, r: number, g: number, b: number) {
        super(x, y);

        this.x = x;
        this.y = y;
        this.radius = this.initialRadius;

        this.r = r;
        this.g = g;
        this.b = b;
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

        let percent = (this.radius - this.initialRadius) / (this.finalRadius - this.initialRadius);
        this.radius += 0.05;
        percent = Math.min(percent, 1);
        ctx.save();
        ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${1 - percent})`;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    /** Check is the smoke should be removed
     * 
     * @returns True if smoke is expired
     */
    checkExpired() {
        if (this.radius >= this.finalRadius) {
            Effect.removeEffect(this);
            return true;
        }
        return false;
    }
}