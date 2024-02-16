import { Component } from "react";
import { Login, LoginState } from "./login";
import { Overlay, OverlayProps } from "./overlay";

import { FightsOnCore } from "../core";

export interface FightsOnProps {
    core: FightsOnCore
}

export interface FightsOnState {
    showLogin: boolean,
    coreRunning: boolean,
    overlayProps: OverlayProps
}

export class FightsOnUI extends Component<FightsOnProps, FightsOnState> {
    constructor(props: FightsOnProps) {
        super(props);
        this.state = {
            showLogin: true,
            coreRunning: false,
            overlayProps:  {
                bullets: 0,
                missiles: 0,
                throttle: 0,
                speed: 0,
                fuel: 0,
                flares: 0
            }
        }
    }

    render() {
        return <div>
            {this.state.showLogin && <Login onStart={(loginState: LoginState) => this.startApp(loginState)} />}
            {this.state.coreRunning && <Overlay 
                bullets={this.state.overlayProps.bullets}
                missiles={this.state.overlayProps.missiles}
                throttle={this.state.overlayProps.throttle}
                speed={this.state.overlayProps.speed}
                fuel={this.state.overlayProps.fuel}
                flares={this.state.overlayProps.flares}
            />}
        </div>
    }

    startApp(loginState: LoginState) {
        this.setState({
            showLogin: false,
            coreRunning: true
        });

        this.props.core.start(loginState);     
        
        window.setInterval(() => {
            this.setState({
                overlayProps: {
                    bullets: FightsOnCore.getOwnship().bullets,
                    missiles: FightsOnCore.getOwnship().missiles,
                    throttle:  FightsOnCore.getOwnship().throttlePosition,
                    speed: FightsOnCore.getOwnship().v,
                    fuel: FightsOnCore.getOwnship().fuel,
                    flares: FightsOnCore.getOwnship().flares
                }
            })
        }, 33)
    }
}