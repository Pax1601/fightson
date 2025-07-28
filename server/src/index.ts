import { WebServer } from "./webserver";
import { WebSocketServer } from "./server";

/* Start the WebServer to serve the basic html page and assets */
const webServer = new WebServer();

/* Start the websocket server, which will take care of message propagation between clients */
const webSocketServer = new WebSocketServer(webServer.getApp());
webSocketServer.start();
