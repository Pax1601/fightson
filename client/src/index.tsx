import { createRoot } from 'react-dom/client';

import { FightsOnCore } from "./core";
import { FightsOnUI } from "./ui";

window.onload = () => {
    var rootElement = document.getElementById('react-root') as HTMLElement;
    var root = createRoot(rootElement);
    root.render(<FightsOnUI core={new FightsOnCore()} />)

    window.onresize = () => {
        let canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        
        var rootElement = document.getElementById('react-root') as HTMLElement;
        rootElement.style.height = `${window.innerHeight}px`
        rootElement.style.width = `${window.innerWidth}px`
    }

    rootElement.style.height = `${window.innerHeight}px`
    rootElement.style.width = `${window.innerWidth}px`

    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
