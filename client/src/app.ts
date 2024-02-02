import { Clock } from "./clock";
import { sleep } from "./utils";

export class App {
    webSocket: WebSocket;
    clock: Clock;

    constructor() {
        this.webSocket = new WebSocket(`ws://localhost:3001`); //TODO configurable

        this.webSocket.addEventListener('open', (ev) => this.onOpen(ev));
        this.webSocket.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data.toString())));
        this.webSocket.addEventListener('close', (ev) => this.onClose(ev));

        this.clock = new Clock();
    }

    async start() {
        this.waitForConnection().then(
            async () => {
                await this.synchronizeTime();
            },
            (err) => {
                console.error(err);
            }
        )
    }

    async waitForConnection() {
        let retries = 10;
        while (retries-- > 0) {
            if (this.webSocket.readyState === this.webSocket.OPEN) {
                return true;
            }
            await sleep(100);
        } 
        throw "Connection timeout";
    }

    async synchronizeTime() {
        console.log(`Starting time synchronization`)
        for (let i = 0; i < 10; i++) {
            let data = JSON.stringify({id: "synchronization", time: Date.now()});
            this.webSocket.send(data);
            await sleep(100);
        }
        console.log(`Estimated time delta: ${this.clock.delta}ms`)
    }

    onOpen(ev: Event) {
        console.log("Websocket connected")
    }

    onMessage(json: any) {
        switch (json.id) {
            case "synchronization":
                this.onSynchronizationMessage(json);
                break;
            default: 
                break;
        }
    }

    onClose(ev: Event) {
        console.log("Websocket disconnected")
    }

    onSynchronizationMessage(json: any) {
        let time: number = json.time;
        let originalTime: number = json.originalTime;

        let delay = (Date.now() - originalTime) / 2;
        let delta = time - (Date.now() - delay);

        this.clock.addDeltaSample(delta);
    }
}