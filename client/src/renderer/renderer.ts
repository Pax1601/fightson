import { FightsOnCore } from "../core";
import { Airplane } from "../simulations/airplane";

import { normalizeAngle } from "../utils/utils";
import { Simulation } from "../simulations/simulation";
import { Effect } from "./effects/effect";

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

    /** Draw the ownship overlay in terms of thrust, AoA and AoB
     * 
     * @param dt Delta time from previous frame, in seconds
     * @returns 
     */
    drawOverlay(dt: number) {
        if (!this.ctx) return;

        this.ctx.save();

        /* Draw background of AoA indicator */
        this.ctx.save();
        this.ctx.translate(25, this.canvas.height - AOA_HEIGHT - 25);
        this.ctx.fillStyle = "#000A";
        this.ctx.fillRect(0, 0, AOA_WIDTH, AOA_HEIGHT);

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
        this.ctx.lineTo(AOA_WIDTH / 2, 9 / 10 * AOA_HEIGHT - (FightsOnCore.getOwnship().angleOfAttack + 0.3) * 8 / 10 * AOA_HEIGHT / 1.3);
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
        for (let airplane of Simulation.getAllByType("airplane")) {
            if (airplane !== FightsOnCore.getOwnship()) {
                let azimuth = Math.atan2(airplane.y - FightsOnCore.getOwnship().y, airplane.x - FightsOnCore.getOwnship().x);
                let bearing = normalizeAngle(FightsOnCore.getOwnship().track - azimuth);
                let range = Math.sqrt(Math.pow(airplane.x - FightsOnCore.getOwnship().x, 2) + Math.pow(airplane.y - FightsOnCore.getOwnship().y, 2));
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
     * @param dt Delta time from the previous drawing, in seconds
     */
    draw(dt: number) {
        if (!this.ctx) return;
        
        this.clear();
        this.setCamera(FightsOnCore.getOwnship().x, FightsOnCore.getOwnship().y, 0);
        this.drawBackground();

        /* Draw effects */
        for (let effect of Effect.getAll()) {
            this.ctx.save();
            this.applyCamera();
            effect.draw(this.ctx, effect.x, effect.y, dt);
            this.ctx.restore();
        }

        /* Draw other simulations */
        for (let other of Simulation.getAllByType("debris")) {
            this.ctx.save();
            this.applyCamera();
            other.draw(this.ctx, other.x, other.y, dt);
            this.ctx.restore();
        }

        /* Draw weapons */
        for (let weapon of Simulation.getAllByType("bullet").concat(Simulation.getAllByType("missile"))) {
            this.ctx.save();
            this.applyCamera();
            weapon.draw(this.ctx, weapon.x, weapon.y, dt);
            this.ctx.restore();
        }

        /* Draw countermeasures */
        for (let countermeasure of Simulation.getAllByType("flare")) {
            this.ctx.save();
            this.applyCamera();
            countermeasure.draw(this.ctx, countermeasure.x, countermeasure.y, dt);
            this.ctx.restore();
        }

        /* Draw airplanes */
        for (let airplane of Simulation.getAllByType("airplane")) {
            this.ctx.save();
            this.drawAirplane(airplane as Airplane);
            this.ctx.restore();
        }

        /* Draw the HUD overlay */
        this.drawOverlay(dt);
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

    /** Applies the camera position and rotation to the context
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