import { Airplane } from "./airplane";
import { FightsOnCore } from "./core";
import { Bullet } from "./bullet";
import { normalizeAngle } from "./utils";
import { Missile } from "./missile";

const ADI_RADIUS = 100;
const AOA_WIDTH = 60;
const AOA_HEIGHT = 200;
const RADAR_WIDTH = 200;
const RADAR_HEIGHT = 200;


/** Renderer class
 * 
 */
export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    camera = { x: 0, y: 0, rotation: 0 };

    radarAngle = 0;
    radarDirection = 1; 
    radarSpeed = 1.5;
    radarPersistency = 2;
    radarContactPositions: {bearing: number, range: number, level: number}[] = [];

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

        /* Clamp the position of the airplane to be inside the screen */
        let x = airplane.x;
        let y = airplane.y;
        let dx = airplane.x - this.camera.x;
        let dy = airplane.y - this.camera.y;
        let clamped = false;

        var angle = Math.atan2(dy, dx);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        if (Math.abs(dx) > this.canvas.width / 2 || Math.abs(dy) > this.canvas.height / 2) {
            clamped = true;
            var angle1 = Math.atan2(this.canvas.height / 2, this.canvas.width / 2);
            var angle2 = Math.atan2(this.canvas.height / 2, -this.canvas.width / 2);
            var angle3 = Math.atan2(-this.canvas.height / 2, -this.canvas.width / 2) + 2 * Math.PI;
            var angle4 = Math.atan2(-this.canvas.height / 2, this.canvas.width / 2) + 2 * Math.PI;

            if (angle > angle4 || angle <= angle1) {
                dx = this.canvas.width / 2 - 30;
                dy = dx * Math.tan(angle);
            }

            if (angle > angle1 && angle <= angle2) {
                dy = this.canvas.height / 2 - 30;
                dx = dy / Math.tan(angle);
            }

            if (angle > angle2 && angle <= angle3) {
                dx = -this.canvas.width / 2 + 30;
                dy = dx * Math.tan(angle);
            }

            if (angle > angle3 && angle <= angle4) {
                dy = -this.canvas.height / 2 + 30;
                dx = dy / Math.tan(angle);
            }
        }

        x = this.camera.x + dx;
        y = this.camera.y + dy;

        if (clamped) {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.strokeStyle = "black";
            this.ctx.fillStyle = "white";
            this.ctx.arc(0, 0, 20, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.translate(30, 0);
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-5, 5);
            this.ctx.lineTo(-5, -5);
            this.ctx.fill();
            this.ctx.restore();
        }

        airplane.draw(this.ctx, x, y);
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

    /** Draws a missile in it's location
     * 
     * @param missile The missile to draw
     */
    drawMissile(missile: Missile) {
        if (!this.ctx) return;

        this.ctx.save();
        this.applyCamera();
        missile.draw(this.ctx);
        this.ctx.restore();
    }

    /** Draw the ownship overlay in terms of thrust, AoA and AoB
     * 
     * @param core App core
     * @param dt Delta time from previous frame, in seconds
     * @returns 
     */
    drawOverlay(core: FightsOnCore, dt: number) {
        if (!this.ctx) return;

        this.ctx.save();
        ///* Draw background of bank indicator */
        //this.ctx.translate(ADI_RADIUS + 25, this.canvas.height - (ADI_RADIUS + 25));
        //this.ctx.beginPath();
        //this.ctx.fillStyle = "#000A";
        //this.ctx.arc(0, 0, ADI_RADIUS, 0, 2 * Math.PI);
        //this.ctx.fill();

        ///* Draw horizon line indicator */
        //this.ctx.save();
        //this.ctx.rotate(-core.ownship.angleOfBank);
        //this.ctx.strokeStyle = "white";
        //this.ctx.beginPath();
        //this.ctx.moveTo(-ADI_RADIUS, 0);
        //this.ctx.lineTo(ADI_RADIUS, 0);
        //this.ctx.stroke();
        //this.ctx.restore();

        ///* Draw airplane indicator */
        //this.ctx.strokeStyle = "white";
        //this.ctx.beginPath();
        //this.ctx.moveTo(-ADI_RADIUS * 0.75, 0);
        //this.ctx.lineTo(-ADI_RADIUS * 0.25, 0);
        //this.ctx.lineTo(-ADI_RADIUS * 0.125, ADI_RADIUS * 0.125);
        //this.ctx.lineTo(0, 0);
        //this.ctx.lineTo(ADI_RADIUS * 0.125, ADI_RADIUS * 0.125);
        //this.ctx.lineTo(ADI_RADIUS * 0.25, 0);
        //this.ctx.lineTo(ADI_RADIUS * 0.75, 0);
        //this.ctx.stroke();
        //this.ctx.restore();

        this.ctx.save();
        /* Draw background of AoA indicator */
        this.ctx.translate(25, this.canvas.height - AOA_HEIGHT - 25);
        this.ctx.fillStyle = "#000A";
        this.ctx.rect(0, 0, AOA_WIDTH, AOA_HEIGHT);
        this.ctx.fill();

        /* Draw ticks on AoA indicator */
        this.ctx.strokeStyle = "white";
        for (let i = 0; i <= 30; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i % 5 == 0 ? 1 / 6 * AOA_WIDTH : 2 / 6 * AOA_WIDTH, 1 / 10 * AOA_HEIGHT + i * 8 / 10 * AOA_HEIGHT / 30);
            this.ctx.lineTo(2.5 / 6 * AOA_WIDTH, 1 / 10 * AOA_HEIGHT + i * 8 / 10 * AOA_HEIGHT / 30);
            this.ctx.moveTo(AOA_WIDTH - (i % 5 == 0 ? 1 / 6 * AOA_WIDTH : 2 / 6 * AOA_WIDTH), 1 / 10 * AOA_HEIGHT + i * 8 / 10 * AOA_HEIGHT / 30);
            this.ctx.lineTo(AOA_WIDTH - 2.5 / 6 * AOA_WIDTH, 1 / 10 * AOA_HEIGHT + i * 8 / 10 * AOA_HEIGHT / 30);
            this.ctx.stroke();
        }

        /* Draw AoA strip */
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(AOA_WIDTH / 2, 9 / 10 * AOA_HEIGHT);
        this.ctx.lineTo(AOA_WIDTH / 2, 9 / 10 * AOA_HEIGHT - (core.ownship.angleOfAttack + 0.3) * 8 / 10 * AOA_HEIGHT / 1.3);
        this.ctx.stroke();
        this.ctx.restore();

        /* Draw radar screen */
        this.ctx.save();
        this.ctx.strokeStyle = "#FFF5";
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = "#0005";
        this.ctx.beginPath();
        this.ctx.translate(this.canvas.width - RADAR_WIDTH - 25, this.canvas.height - RADAR_HEIGHT - 25);
        this.ctx.rect(0, 0, RADAR_WIDTH, RADAR_HEIGHT);
        this.ctx.fill();
        this.ctx.stroke();

        for (let i = 1; i <= 3; i++) {
            /* Draw range ticks */
            this.ctx.beginPath();
            this.ctx.moveTo(0, RADAR_HEIGHT * i / 4);
            this.ctx.lineTo(RADAR_WIDTH, RADAR_HEIGHT * i / 4);
            this.ctx.stroke();

            /* Draw bearing ticks */
            this.ctx.beginPath();
            this.ctx.moveTo(RADAR_WIDTH * i / 4, 0);
            this.ctx.lineTo(RADAR_WIDTH * i / 4, RADAR_HEIGHT);
            this.ctx.stroke();
        }

        /* Animate the radar scan */
        this.radarAngle += this.radarDirection * this.radarSpeed * dt;
        if (this.radarAngle >= 1)
            this.radarDirection = -1;
        else if (this.radarAngle <= -1)
            this.radarDirection = 1;

        /* Draw radar scan */
        this.ctx.beginPath();
        this.ctx.moveTo(RADAR_WIDTH / 2 + RADAR_WIDTH * this.radarAngle / 2, 0);
        this.ctx.lineTo(RADAR_WIDTH / 2 + RADAR_WIDTH * this.radarAngle / 2, RADAR_HEIGHT);
        this.ctx.stroke();

        /* Update the radar tracks */
        for (let key of Object.keys(core.airplanes)) {
            let airplane = core.airplanes[key];
            if (airplane !== core.ownship) {
                let azimuth = Math.atan2(airplane.y - core.ownship.y, airplane.x - core.ownship.x);
                let bearing = normalizeAngle(core.ownship.track - azimuth);
                let range = Math.sqrt(Math.pow(airplane.x - core.ownship.x, 2) + Math.pow(airplane.y - core.ownship.y, 2));
                if (Math.abs(bearing + this.radarAngle) < this.radarSpeed * dt) {
                    this.radarContactPositions.push({bearing: bearing, range: range, level: 1});
                }
            }
        }

        /* Remove old contacts */
        this.radarContactPositions = this.radarContactPositions.filter((contact) => {return contact.level > 0});

        /* Draw the contacts */
        this.ctx.lineWidth = 5;
        for (let contact of this.radarContactPositions) {
            if (Math.abs(contact.bearing) < 1 && contact.range < 10000) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${contact.level})`;
                contact.level -= 1 / this.radarPersistency * dt;
                let x = contact.bearing * (RADAR_WIDTH / 2 - 10);
                let y = contact.range / 10000 * RADAR_HEIGHT;
                this.ctx.beginPath();
                this.ctx.moveTo(RADAR_WIDTH / 2 - x - 5, RADAR_HEIGHT - y);
                this.ctx.lineTo(RADAR_WIDTH / 2 - x + 5, RADAR_HEIGHT - y);
                this.ctx.stroke();
            }
        }

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

        /* Draw missiles */
        for (let missile of Object.values(core.missiles)) {
            this.drawMissile(missile);
        }

        this.drawOverlay(core, dt);
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
    applyCamera() {
        if (!this.ctx) return;

        /* corely camera rotation */
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(-this.camera.rotation);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);

        /* corely camera translation */
        this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);
    }
}