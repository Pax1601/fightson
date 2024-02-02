
import express, { Express, Request, Response } from "express";
import path from "path";

const CLIENT_PATH = path.join(__dirname, '..', '..', 'client');

export class WebServer {
    app: Express = express();
    port = 3000;

    constructor() {
        this.app.get("/", this.get);
        this.app.use("/client/javascripts", express.static(path.join(CLIENT_PATH, 'build')));
        this.app.use("/client/html", express.static(path.join(CLIENT_PATH, 'html')));
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`WebServer listening on ${this.port}`)
        })
    }

    get(req: Request, res: Response) {
        res.sendFile(path.join(CLIENT_PATH, 'html', 'index.html'));
    };    
}