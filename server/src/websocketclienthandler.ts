import { IncomingMessage } from "http";
import * as ws from "ws";
import { sleep } from "./utils";

export class WebSocketClientHandler {
    webSocket: ws.WebSocket;
    address: string;
    
    constructor(connection: ws.WebSocket, req: IncomingMessage) {
        this.webSocket = connection;
        this.address = req.socket.remoteAddress ?? "unkown";

        this.webSocket.on('message', (data) => this.onMessage(data));
        this.webSocket.on('close', (connection) => this.onDisconnect(connection));

        console.log(`${this.address} connected`)
    } 

    onMessage(data: any) {
        console.log(`${this.address} received ${data.buffer.byteLength} bytes`);
        let json = JSON.parse(data.toString());
        switch (json.id) {
            case "synchronization":
                this.onSynchronizationMessage(json);
                break;
            default: 
                break;
        }
    }

    onDisconnect(connection: number) {
        console.log(`${this.address} disconnected`)
    }

    async onSynchronizationMessage(json: any) {
        let time = json.time;
        let timeNow = Date.now();
        this.webSocket.send(JSON.stringify({id: "synchronization", originalTime: time, time: timeNow}));
    }
}