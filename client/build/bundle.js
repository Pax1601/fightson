(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const clock_1 = require("./clock");
const utils_1 = require("./utils");
class App {
    constructor() {
        this.webSocket = new WebSocket(`ws://localhost:3001`); //TODO configurable
        this.webSocket.addEventListener('open', (ev) => this.onOpen(ev));
        this.webSocket.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data.toString())));
        this.webSocket.addEventListener('close', (ev) => this.onClose(ev));
        this.clock = new clock_1.Clock();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.waitForConnection().then(() => __awaiter(this, void 0, void 0, function* () {
                yield this.synchronizeTime();
            }), (err) => {
                console.error(err);
            });
        });
    }
    waitForConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            let retries = 10;
            while (retries-- > 0) {
                if (this.webSocket.readyState === this.webSocket.OPEN) {
                    return true;
                }
                yield (0, utils_1.sleep)(100);
            }
            throw "Connection timeout";
        });
    }
    synchronizeTime() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Starting time synchronization`);
            for (let i = 0; i < 10; i++) {
                let data = JSON.stringify({ id: "synchronization", time: Date.now() });
                this.webSocket.send(data);
                yield (0, utils_1.sleep)(100);
            }
            console.log(`Estimated time delta: ${this.clock.delta}ms`);
        });
    }
    onOpen(ev) {
        console.log("Websocket connected");
    }
    onMessage(json) {
        switch (json.id) {
            case "synchronization":
                this.onSynchronizationMessage(json);
                break;
            default:
                break;
        }
    }
    onClose(ev) {
        console.log("Websocket disconnected");
    }
    onSynchronizationMessage(json) {
        let time = json.time;
        let originalTime = json.originalTime;
        let delay = (Date.now() - originalTime) / 2;
        let delta = time - (Date.now() - delay);
        this.clock.addDeltaSample(delta);
    }
}
exports.App = App;

},{"./clock":2,"./utils":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = void 0;
class Clock {
    constructor() {
        this.deltaSamples = [];
        this.delta = 0;
    }
    addDeltaSample(sample) {
        this.deltaSamples.push(sample);
        this.delta = 0;
        for (let deltaSample of this.deltaSamples) {
            this.delta += deltaSample / this.deltaSamples.length;
        }
    }
    getTime() {
        return Date.now() + this.delta;
    }
}
exports.Clock = Clock;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const app = new app_1.App();
app.start();

},{"./app":1}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLnRzIiwic3JjL2Nsb2NrLnRzIiwic3JjL2luZGV4LnRzIiwic3JjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O0FDQUEsbUNBQWdDO0FBQ2hDLG1DQUFnQztBQUVoQyxNQUFhLEdBQUc7SUFJWjtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLG1CQUFtQjtRQUUxRSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5FLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxhQUFLLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUssS0FBSzs7WUFDUCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQ3pCLEdBQVMsRUFBRTtnQkFDUCxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNqQyxDQUFDLENBQUEsRUFDRCxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNKLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFD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QUFLLENBQUM7SUFDbkMsQ0FBQztDQUNKO0FBcEJELHNCQW9CQzs7Ozs7QUNwQkQsK0JBQTRCO0FBRTVCLE1BQU0sR0FBRyxHQUFHLElBQUksU0FBRyxFQUFFLENBQUM7QUFDdEIsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7QUNIWixTQUFnQixLQUFLLENBQUMsRUFBVTtJQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFGRCxzQkFFQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IENsb2NrIH0gZnJvbSBcIi4vY2xvY2tcIjtcclxuaW1wb3J0IHsgc2xlZXAgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFwcCB7XHJcbiAgICB3ZWJTb2NrZXQ6IFdlYlNvY2tldDtcclxuICAgIGNsb2NrOiBDbG9jaztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLndlYlNvY2tldCA9IG5ldyBXZWJTb2NrZXQoYHdzOi8vbG9jYWxob3N0OjMwMDFgKTsgLy9UT0RPIGNvbmZpZ3VyYWJsZVxyXG5cclxuICAgICAgICB0aGlzLndlYlNvY2tldC5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgKGV2KSA9PiB0aGlzLm9uT3BlbihldikpO1xyXG4gICAgICAgIHRoaXMud2ViU29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXYpID0+IHRoaXMub25NZXNzYWdlKEpTT04ucGFyc2UoZXYuZGF0YS50b1N0cmluZygpKSkpO1xyXG4gICAgICAgIHRoaXMud2ViU29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgKGV2KSA9PiB0aGlzLm9uQ2xvc2UoZXYpKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9jayA9IG5ldyBDbG9jaygpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHN0YXJ0KCkge1xyXG4gICAgICAgIHRoaXMud2FpdEZvckNvbm5lY3Rpb24oKS50aGVuKFxyXG4gICAgICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNocm9uaXplVGltZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgd2FpdEZvckNvbm5lY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHJldHJpZXMgPSAxMDtcclxuICAgICAgICB3aGlsZSAocmV0cmllcy0tID4gMCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy53ZWJTb2NrZXQucmVhZHlTdGF0ZSA9PT0gdGhpcy53ZWJTb2NrZXQuT1BFTikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgc2xlZXAoMTAwKTtcclxuICAgICAgICB9IFxyXG4gICAgICAgIHRocm93IFwiQ29ubmVjdGlvbiB0aW1lb3V0XCI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc3luY2hyb25pemVUaW1lKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBTdGFydGluZyB0aW1lIHN5bmNocm9uaXphdGlvbmApXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gSlNPTi5zdHJpbmdpZnkoe2lkOiBcInN5bmNocm9uaXphdGlvblwiLCB0aW1lOiBEYXRlLm5vdygpfSk7XHJcbiAgICAgICAgICAgIHRoaXMud2ViU29ja2V0LnNlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBFc3RpbWF0ZWQgdGltZSBkZWx0YTogJHt0aGlzLmNsb2NrLmRlbHRhfW1zYClcclxuICAgIH1cclxuXHJcbiAgICBvbk9wZW4oZXY6IEV2ZW50KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJXZWJzb2NrZXQgY29ubmVjdGVkXCIpXHJcbiAgICB9XHJcblxyXG4gICAgb25NZXNzYWdlKGpzb246IGFueSkge1xyXG4gICAgICAgIHN3aXRjaCAoanNvbi5pZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3luY2hyb25pemF0aW9uXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU3luY2hyb25pemF0aW9uTWVzc2FnZShqc29uKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiBcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkNsb3NlKGV2OiBFdmVudCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiV2Vic29ja2V0IGRpc2Nvbm5lY3RlZFwiKVxyXG4gICAgfVxyXG5cclxuICAgIG9uU3luY2hyb25pemF0aW9uTWVzc2FnZShqc29uOiBhbnkpIHtcclxuICAgICAgICBsZXQgdGltZTogbnVtYmVyID0ganNvbi50aW1lO1xyXG4gICAgICAgIGxldCBvcmlnaW5hbFRpbWU6IG51bWJlciA9IGpzb24ub3JpZ2luYWxUaW1lO1xyXG5cclxuICAgICAgICBsZXQgZGVsYXkgPSAoRGF0ZS5ub3coKSAtIG9yaWdpbmFsVGltZSkgLyAyO1xyXG4gICAgICAgIGxldCBkZWx0YSA9IHRpbWUgLSAoRGF0ZS5ub3coKSAtIGRlbGF5KTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9jay5hZGREZWx0YVNhbXBsZShkZWx0YSk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY2xhc3MgQ2xvY2sge1xyXG4gICAgZGVsdGFTYW1wbGVzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgZGVsdGE6IG51bWJlciA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGFkZERlbHRhU2FtcGxlKHNhbXBsZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5kZWx0YVNhbXBsZXMucHVzaChzYW1wbGUpO1xyXG5cclxuICAgICAgICB0aGlzLmRlbHRhID0gMDtcclxuICAgICAgICBmb3IgKGxldCBkZWx0YVNhbXBsZSBvZiB0aGlzLmRlbHRhU2FtcGxlcykge1xyXG4gICAgICAgICAgICB0aGlzLmRlbHRhICs9IGRlbHRhU2FtcGxlIC8gdGhpcy5kZWx0YVNhbXBsZXMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRUaW1lKCkge1xyXG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpICsgdGhpcy5kZWx0YTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEFwcCB9IGZyb20gXCIuL2FwcFwiO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xyXG5hcHAuc3RhcnQoKTsiLCJleHBvcnQgZnVuY3Rpb24gc2xlZXAobXM6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xyXG59Il19
