export class Smoke {
    r: number;
    g: number;
    b: number;
    birthTime: number;
    initialRadius: number = 2;
    finalRadius: number = 5;
    radius: number;
    x: number;
    y: number;

    constructor(x: number, y: number, r: number, g: number, b: number) {
        this.birthTime = Date.now();
        this.x = x;
        this.y = y;
        this.radius = this.initialRadius;

        this.r = r;
        this.g = g;
        this.b = b;
    }

    /** Draw the smoke
     * 
     * @param ctx Canvas Rendering Context. 
     */
    draw(ctx: CanvasRenderingContext2D) {
        this.radius += 0.05;
        let percent = (this.radius - this.initialRadius) / (this.finalRadius - this.initialRadius);
        percent = Math.max(percent, 0);
        ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${1 - percent})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    /** Check is the smoke should be removed
     * 
     * @returns True if smoke is expired
     */
    expired() {
        return this.radius >= this.finalRadius;
    }
}