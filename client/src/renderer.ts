export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    camera = {x: 0, y: 0, rotation: 0};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
    }

    clear() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            throw "No valid CanvasRenderingContext2D available";
        }
    }

    drawBackground() {
        this.camera.x += 1;
        if (this.ctx) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height );
            
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(this.camera.rotation);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
            this.ctx.translate(this.camera.x, this.camera.y);
            this.ctx.beginPath();
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 1;
            let dx = this.canvas.width / 10;
            let dy = this.canvas.height / 10;
            for (let i = 0; i <= 10; i++) {
                this.ctx.moveTo(0, i * dy);
                this.ctx.lineTo(this.canvas.width, i * dy);
            }
            for (let i = 0; i <= 10; i++) {
                this.ctx.moveTo(i * dx, 0);
                this.ctx.lineTo(i * dx, this.canvas.height);
            }
            this.ctx.stroke();
            this.ctx.restore();

        } else {
            throw "No valid CanvasRenderingContext2D available";
        }
    }

    draw() {
        this.clear();
        this.drawBackground();
    }
}