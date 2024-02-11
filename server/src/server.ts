import { WebSocketServer } from 'ws';
import { ClientHandler } from "./clienthandler";

/** WebSocket server. Will instantiate a handler for each new connection and propagate messages from a client to the
 * 
 */
export class Server {
    webSocketServer: WebSocketServer;
    clientHandlers: ClientHandler[] = [];

    constructor() {
        // TODO: make port configurable
        this.webSocketServer = new WebSocketServer({
            port: 5001
        });
    }

    /** Start the server. Create a new handler each time a new client connects to the websocket.
     *  
     */
    start() {
        this.webSocketServer.on('connection', (webSocket, req) => {
            let clientHandler = new ClientHandler(this, webSocket);
            this.clientHandlers.push(clientHandler);
        });
    }

    /** Propagates a message from a client to all other connected clients
     * 
     * @param sender The ClientHandler that sent the message originally
     * @param json The json message to propagate
     */
    propagate(sender: ClientHandler, json: any) {
        for (let clientHandler of this.clientHandlers) {
            if (clientHandler != sender) {
                clientHandler.send(json);
            }
        }
    }

    /** Removes a handler from the list of active handlers. In case of disconnection.
     * 
     * @param handler The handler to remove.
     */
    removeClientHandler(handler: ClientHandler) {
        this.clientHandlers = this.clientHandlers.filter(h => h != handler);
    }
}

