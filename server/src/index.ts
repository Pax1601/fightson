import { WebServer } from "./webserver";
import { Server } from "./server";

/* Start the WebServer to serve the basic html page and assets */
const webServer = new WebServer();
webServer.start();

/* Start the websocket server, which will take care of message propagation between clients */
const webSocketServer = new Server();
webSocketServer.start();
