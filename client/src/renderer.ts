import { Airplane } from "./airplane";
import { FightsOnCore } from "./core";
import { Bullet } from "./bullet";

/** Renderer class
 * 
 */
export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    camera = {x: 0, y: 0, rotation: 0};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
    }

    /** Clear the scene
     * 
     */
    clear() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /** Draw the background of the scene
     * 
     */
    drawBackground() {
        if (!this.ctx) return;

        /* Start from empty background */
        this.ctx.fillStyle = "#533416";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height );
        
        this.ctx.save();
        this.applyCamera();

        /* Draw basic checkerboard pattern */
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#FFF4";
        this.ctx.lineWidth = 1;
        
        /* Define number of squares */
        const nSquares = 10;
        const nTotSquares = Math.ceil(nSquares * Math.sqrt(2) / 2);

        /* Checkerboard square size */
        let dx = this.canvas.width / nSquares;
        let dy = this.canvas.height / nSquares;

        /* Compute the location of the first line */
        let fx = this.camera.x - nTotSquares * dx;
        let x = fx - fx % dx;
        let fy = this.camera.y - nTotSquares * dy;
        let y = fy - fy % dy;

        for (let i = 0; i <= 2 * nTotSquares; i++) {
            this.ctx.moveTo(x, this.camera.y - this.canvas.height);
            this.ctx.lineTo(x, this.camera.y + this.canvas.height);
            x += dx;
        }
        
        for (let i = 0; i <= 2 * nTotSquares; i++) {
            this.ctx.moveTo(this.camera.x - this.canvas.width, y);
            this.ctx.lineTo(this.camera.x + this.canvas.width, y);
            y += dy;
        }
        this.ctx.stroke();

        /* Restore */
        this.ctx.restore();
    }

    /** Draws an airplane in it's location
     * 
     * @param airplane The airplane to draw
     */
    drawAirplane(airplane: Airplane) {
        if (!this.ctx) return;

        this.ctx.save();
        this.applyCamera();
        airplane.draw(this.ctx);
        this.ctx.restore();
    }

    /** Draws a bullet in it's location
     * 
     * @param bullet The bullet to draw
     */
    drawBullet(bullet: Bullet) {
        if (!this.ctx) return;

        this.ctx.save();
        this.applyCamera();
        bullet.draw(this.ctx);
        this.ctx.restore();
    }

    /** Draw the scene
     * 
     * @param app Reference to the main app, to retrieve elements to draw
     * @param dt Delta time from the previous drawing, in seconds
     */
    draw(app: FightsOnCore, dt: number) {
        this.clear();
        this.setCamera(app.ownship.x, app.ownship.y, 0);
        this.drawBackground();
        
        /* Draw airplanes */
        for (let airplane of Object.values(app.airplanes)) {
            this.drawAirplane(airplane);
        }

        /* Draw bullets */
        for (let bullet of app.bullets) {
            this.drawBullet(bullet);
        }
    }

    /** Sets the scene camera to a specific location
     * 
     * @param x X position of the camera in pixels
     * @param y Y position of the camera in pixels
     * @param rotation Rotation of the camera in radians
     */
    setCamera(x: number, y: number, rotation: number) {
        this.camera = {x: x, y: y, rotation: rotation};
    }

    /** Applies the camera position and rotation to the context
     * 
     */
    applyCamera() {
        if (!this.ctx) return;

        /* Apply camera rotation */
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(-this.camera.rotation);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        
        /* Apply camera translation */
        this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);
    }
}