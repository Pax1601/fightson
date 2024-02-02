import { WebServer } from "./webserver";
import { WebSocketServer } from "./websocketserver";

const webServer = new WebServer();
webServer.start();

const webSocketServer = new WebSocketServer();
webSocketServer.start();
