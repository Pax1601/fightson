import * as ws from 'ws';
import { WebSocketClientHandler } from "./websocketclienthandler";
import { IncomingMessage } from 'http';

export class WebSocketServer {
    webSocketServer: ws.WebSocketServer;
    clientHandlers: WebSocketClientHandler[] = [];

    constructor() {
        this.webSocketServer = new ws.WebSocketServer({
            port: 3001
        });
    }

    start() {
        this.webSocketServer.on('connection', (webSocket, req) => {
            this.clientHandlers.push(new WebSocketClientHandler(webSocket, req));
        });
    }
}

