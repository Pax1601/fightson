import { Server } from "ws";
import { ClientHandler } from "./clienthandler";
import { createServer } from "http";
import fs from "fs";

/** WebSocket server. Will instantiate a handler for each new connection and propagate messages from a client to the
 *
 */
export class WebSocketServer {
  webSocketServer: Server;
  clientHandlers: ClientHandler[] = [];
  server: any;

  constructor(expressApp: any) {
    // TODO: make port configurable
    this.server = createServer();
    this.webSocketServer = new Server({
      server: this.server,
    });
    this.server.on("request", expressApp);
  }

  /** Start the server. Create a new handler each time a new client connects to the websocket.
   *
   */
  start() {
    this.webSocketServer.on("connection", (webSocket, req) => {
      let clientHandler = new ClientHandler(this, webSocket);
      this.clientHandlers.push(clientHandler);
    });

    // Read configuration file
    fs.readFile("config.json", "utf8", (err, data) => {
      if (err) {
        console.error("Error reading config file:", err);
        return;
      }

      // Parse the configuration file
      try {
        const config = JSON.parse(data);
        console.log("Configuration loaded:", config);

        this.server.listen(config.port, function () {
          console.log(`http/ws server listening on ${config.port}`);
        });
      } catch (parseError) {
        console.error("Error parsing config file:", parseError);
      }
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
    this.clientHandlers = this.clientHandlers.filter((h) => h != handler);
  }
}
