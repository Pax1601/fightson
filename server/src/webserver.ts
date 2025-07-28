/** Simple http webserver that server the static content of the webpage
 * 
 */
import express, { Express, Request, Response } from "express";
import path from "path";

/* Path to the client folder */
const CLIENT_PATH = path.join(__dirname, '..', '..', 'client');

export class WebServer {
    app: Express = express();
    port = 5000;

    constructor() {
        this.app.get("/", this.get);

        /* Setup static content */
        this.app.use("/client/javascripts", express.static(path.join(CLIENT_PATH, 'build')));
        this.app.use("/client/html", express.static(path.join(CLIENT_PATH, 'html')));
        this.app.use("/client/img", express.static(path.join(CLIENT_PATH, 'img')));
    }

    /** Starts listening for incoming requests
     * 
     */
    getApp() {
        return this.app;
    }

    /** Simple get request handler
     * 
     * @param req Request
     * @param res Response
     */
    get(req: Request, res: Response) {
        res.sendFile(path.join(CLIENT_PATH, 'html', 'index.html'));
    };    
}