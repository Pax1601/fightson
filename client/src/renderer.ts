import { Airplane } from "./airplane";
import { FightsOnCore } from "./core";
import { Bullet } from "./bullet";

/** Renderer class
 * 
 */
export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    camera = { x: 0, y: 0, rotation: 0 };

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
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.corelyCamera();

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
        this.corelyCamera();
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
        this.corelyCamera();
        bullet.draw(this.ctx);
        this.ctx.restore();
    }

    /** Draw the ownship overlay in terms of thrust, AoA and AoB
     * 
     */
    drawOverlay(core: FightsOnCore) {
        if (!this.ctx) return;

        const ADI_RADIUS = 100;
        const AOA_WIDTH = 60;
        const AOA_HEIGHT = 200;

        this.ctx.save();
        /* Draw background of bank indicator */
        this.ctx.translate(ADI_RADIUS + 25, this.canvas.height - (ADI_RADIUS + 25));
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000A";
        this.ctx.arc(0, 0, ADI_RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();

        /* Draw horizon line indicator */
        this.ctx.save();
        this.ctx.rotate(-core.ownship.angleOfBank);
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.moveTo(-ADI_RADIUS, 0);
        this.ctx.lineTo(ADI_RADIUS, 0);
        this.ctx.stroke();
        this.ctx.restore();

        /* Draw airplane indicator */
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.moveTo(-ADI_RADIUS * 0.75, 0);
        this.ctx.lineTo(-ADI_RADIUS * 0.25, 0);
        this.ctx.lineTo(-ADI_RADIUS * 0.125, ADI_RADIUS * 0.125);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(ADI_RADIUS * 0.125, ADI_RADIUS * 0.125);
        this.ctx.lineTo(ADI_RADIUS * 0.25, 0);
        this.ctx.lineTo(ADI_RADIUS * 0.75, 0);
        this.ctx.stroke();
        this.ctx.restore();

        this.ctx.save();
        /* Draw background of AoA indicator */
        this.ctx.translate(250, this.canvas.height - 125);
        this.ctx.fillStyle = "#000A";
        this.ctx.rect(0, 0, 30, 100);
        this.ctx.fill();

        /* Draw ticks on AoA indicator */
        this.ctx.strokeStyle = "white";
        for (let i = 0; i <= 30; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i % 5 == 0? 5: 10, 10 + i * 80 / 30);
            this.ctx.lineTo(12, 10 + i * 80 / 30);
            this.ctx.moveTo(30 - (i % 5 == 0? 5: 10), 10 + i * 80 / 30);
            this.ctx.lineTo(30 - 12, 10 + i * 80 / 30);
            this.ctx.stroke();
        }
        
        /* Draw AoA strip */
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 90);
        this.ctx.lineTo(15, 90 - (core.ownship.angleOfAttack + 0.3) * 80 / 1.3);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /** Draw the scene
     * 
     * @param core Reference to the main core, to retrieve elements to draw
     * @param dt Delta time from the previous drawing, in seconds
     */
    draw(core: FightsOnCore, dt: number) {
        this.clear();
        this.setCamera(core.ownship.x, core.ownship.y, 0);
        this.drawBackground();

        /* Draw airplanes */
        for (let airplane of Object.values(core.airplanes)) {
            this.drawAirplane(airplane);
        }

        /* Draw bullets */
        for (let bullet of core.bullets) {
            this.drawBullet(bullet);
        }

        this.drawOverlay(core);
    }

    /** Sets the scene camera to a specific location
     * 
     * @param x X position of the camera in pixels
     * @param y Y position of the camera in pixels
     * @param rotation Rotation of the camera in radians
     */
    setCamera(x: number, y: number, rotation: number) {
        this.camera = { x: x, y: y, rotation: rotation };
    }

    /** corelies the camera position and rotation to the context
     * 
     */
    corelyCamera() {
        if (!this.ctx) return;

        /* corely camera rotation */
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(-this.camera.rotation);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);

        /* corely camera translation */
        this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);
    }
}