import { Component, MouseEventHandler } from "react";

class AxisSelector extends Component<{ label: string, gamepads: Gamepad[], selectedGamepad: Gamepad | null, onGamepadSelection: any, onAxisSelection: any }, {}> {
    render() {
        return <div style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px"
        }}>
            <span> {this.props.label} </span>
            <select onChange={(ev: any) => this.props.onGamepadSelection(ev)} style={{ width: "150px", marginLeft: "auto" }}>
                <option value="Keyboard">Keyboard</option>
                {this.props.gamepads.map((gamepad) => {
                    return <option key={gamepad.id} value={gamepad.id}>{gamepad.id}</option>
                })}
            </select>
            {this.props.selectedGamepad && <select onChange={(ev: any) => this.props.onAxisSelection(ev)}>
                {this.props.selectedGamepad.axes.map((_, index) => {
                    return <option key={index} value={index}>{index}</option>
                })}
            </select>
            }
        </div>
    }
}


export interface LoginProps {
    onStart: CallableFunction
}

export interface LoginState {
    username: string,
    gamepads: Gamepad[],
    pitchControl: { gamepad: Gamepad, axis: number } | null,
    rollControl: { gamepad: Gamepad, axis: number } | null,
    thrustControl: { gamepad: Gamepad, axis: number } | null,
    gunControl: { gamepad: Gamepad, button: GamepadButton } | null
}

export class Login extends Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);

        this.state = {
            username: "",
            gamepads: [],
            pitchControl: null,
            rollControl: null,
            thrustControl: null,
            gunControl: null
        }

        window.setInterval(() => this.pollGamepads(), 500);
    }

    pollGamepads() {
        this.setState({
            gamepads: navigator.getGamepads().filter((gamepad) => {
                return gamepad !== null
            }).map((gamepad) => {
                return gamepad as Gamepad;
            })
        })
    }

    setControl(key: string, ev: Event) {
        var target = ev.target as HTMLOptionElement;
        if (target !== null) {
            var gamepad = this.state.gamepads.find((gamepad) => { return gamepad.id === target.value });
            switch (key) {
                case 'pitch':
                    this.setState({
                        pitchControl: gamepad ? { gamepad: gamepad, axis: 0 } : null
                    })
                    break;
                case 'roll':
                    this.setState({
                        rollControl: gamepad ? { gamepad: gamepad, axis: 0 } : null
                    })
                    break;
                case 'thrust':
                    this.setState({
                        thrustControl: gamepad ? { gamepad: gamepad, axis: 0 } : null
                    })
                    break;
            }
        }
    }

    setAxis(key: string, ev: Event) {
        var target = ev.target as HTMLOptionElement;
        if (target !== null) {
            var axis = Number(target.value);
            switch (key) {
                case 'pitch':
                    if (this.state.pitchControl)
                        this.state.pitchControl.axis = axis;
                    this.setState(this.state);
                    break;
                case 'roll':
                    if (this.state.rollControl)
                        this.state.rollControl.axis = axis;
                    this.setState(this.state);
                    break;
                case 'thrust':
                    if (this.state.thrustControl)
                        this.state.thrustControl.axis = axis;
                    this.setState(this.state);
                    break;
            }
        }
    }

    render() {
        return <div style={{
            position: "absolute",
            top: "50%",
            bottom: "50%",
            width: "300px",
            height: "200px"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "5px"
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    columnGap: "5px"
                }}>
                    <span>Username</span>
                    <input type="text" style={{ width: "150px", marginLeft: "auto" }}></input>
                </div>
                <AxisSelector label="Pitch axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.state.pitchControl?.gamepad ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('pitch', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('pitch', ev)}
                ></AxisSelector>
                <AxisSelector label="Roll axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.state.rollControl?.gamepad ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('roll', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('roll', ev)}
                ></AxisSelector>
                <AxisSelector label="Thrust axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.state.thrustControl?.gamepad ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('thrust', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('thrust', ev)}
                ></AxisSelector>

                <div style={{ display: "flex" }}>
                    <button style={{ marginLeft: "auto" }} onClick={() => this.props.onStart(this.state)}>Start</button>
                </div>
            </div>
        </div>
    }
}