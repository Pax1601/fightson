import { createRoot } from 'react-dom/client';

import { FightsOnCore } from "./core";
import { FightsOnUI } from "./ui";

window.onload = () => {
    var root = createRoot(document.getElementById('react-root') as HTMLElement);
    root.render(<FightsOnUI core={new FightsOnCore()} />)
}
