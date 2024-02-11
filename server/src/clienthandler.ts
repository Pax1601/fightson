import { RawData, WebSocket } from "ws";
import { nanoid } from 'nanoid';
import { Server } from "./server";

/** Client handler that will listen to messages from a client, perform client synchronization, and handle message propagation.
 * 
 */

export class ClientHandler {
    server: Server
    webSocket: WebSocket;
    uuid: string;
    
    /** Constructor
     * 
     * @param server Reference to the main server, used for propagation
     * @param webSocket Reference to the WebSocket associated with this client
     */
    constructor(server: Server, webSocket: WebSocket) {
        /* Generate a random uuid to identify this client */
        this.uuid = nanoid(10);

        this.server = server;
        this.webSocket = webSocket;
        
        /* Define listeners */
        this.webSocket.on('message', (data) => this.onMessage(data));
        this.webSocket.on('close', (connection) => this.onDisconnect(connection));

        /* Send back a connection confirmation message to the client. This informs the client
        on what is uuid will be */
        this.webSocket.send(JSON.stringify({id: 'connection', uuid: this.uuid}));

        console.log(`${this.uuid} connected`)
    } 

    /** On message reception callback
     * 
     * @param data 
     */
    onMessage(data: RawData) {
        let json = JSON.parse(data.toString());

        /* Switch on the message id to find the appropriate callback */
        switch (json.id) {
            case "synchronization":
                this.onSynchronizationMessage(json);
                break;
            case "update":
                this.onUpdateMessage(json);
            default: 
                break;
        }
    }

    /** Callback on client disconnection
     * 
     * @param connection ???
     */
    onDisconnect(connection: number) {
        console.log(`${this.uuid} disconnected`)
        this.server.propagate(this, {id: "death", type: "airplane", uuid: this.uuid});
        this.server.removeClientHandler(this);
    }

    /** Synchronization message callback. The server sends the message back appending the time of reception in local time. 
     * This is used by the client to synchronize its local timer to the server's, in order to establish a common time reference.
     * 
     * @param json Message content
     */
    onSynchronizationMessage(json: any) {
        let time = json.time;
        let timeNow = Date.now();
        this.webSocket.send(JSON.stringify({id: "synchronization", txTime: time, time: timeNow}));
    }

    /** Update message callback. This message is simply propagated to all other clients.
     * 
     * @param json Message content
     */
    onUpdateMessage(json: any) {
        this.server.propagate(this, json);
    }

    /** Sends a message to the client.
     * 
     * @param json Message content
     */
    send(json: any) {
        this.webSocket.send(JSON.stringify(json));
    }
}