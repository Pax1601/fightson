import { Component } from "react";
import { Login, LoginState } from "./login";
import { FightsOnCore } from "./core";

export interface FightsOnProps {
    core: FightsOnCore
}

export interface FightsOnState {
    showLogin: boolean,
    coreRunning: boolean
}

export class FightsOnUI extends Component<FightsOnProps, FightsOnState> {
    constructor(props: FightsOnProps) {
        super(props);
        this.state = {
            showLogin: true,
            coreRunning: false
        }
    }

    render() {
        return <div>
            {this.state.showLogin && <Login onStart={(loginState: LoginState) => this.startApp(loginState)} />}
        </div>
    }

    startApp(loginState: LoginState) {
        this.setState({
            showLogin: false,
            coreRunning: true
        });

        this.props.core.start();        
    }
}