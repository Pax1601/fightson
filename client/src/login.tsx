import { Component, MouseEventHandler } from "react";

class AxisSelector extends Component<{ label: string, gamepads: Gamepad[], selectedGamepad: Gamepad | null, selectedAxis: number | null, onGamepadSelection: any, onAxisSelection: any }, {}> {
    render() {
        return <div style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px"
        }}>
            <span> {this.props.label} </span>
            <select onChange={(ev: any) => this.props.onGamepadSelection(ev)}
                style={{ width: "250px", marginLeft: "auto" }}
                value={this.props.selectedGamepad?.id ?? "Keyboard"}>
                <option value="Keyboard">Keyboard</option>
                {this.props.gamepads.map((gamepad) => {
                    return <option key={gamepad.id} value={gamepad.id}>{gamepad.id}</option>
                })}
            </select>
            {this.props.selectedGamepad
                &&
                <select onChange={(ev: any) => this.props.onAxisSelection(ev)}
                    value={this.props.selectedAxis ?? 0}>
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
    pitchControl: { id: string, axis: number } | null,
    rollControl: { id: string, axis: number } | null,
    thrustControl: { id: string, axis: number } | null,
    gunControl: { id: string, button: number } | null
}

export interface CookieData {
    username: string,
    pitchControl: { id: string, axis: number } | null,
    rollControl: { id: string, axis: number } | null,
    thrustControl: { id: string, axis: number } | null,
    gunControl: { id: string, button: number } | null
}

export class Login extends Component<LoginProps, LoginState> {
    cookieData: CookieData | null;
    cookieLoaded: boolean = false;

    constructor(props: LoginProps) {
        super(props);

        /* Try and load saved cookie data if possible */
        const localData = localStorage.getItem("fights-on-data");
        if (localData) {
            this.cookieData = JSON.parse(localData);
        } else {
            this.cookieData = null;
        }

        this.state = {
            username: this.cookieData?.username ?? "",
            gamepads: [],
            pitchControl: this.cookieData?.pitchControl ?? null,
            rollControl: this.cookieData?.rollControl ?? null,
            thrustControl: this.cookieData?.thrustControl ?? null,
            gunControl: this.cookieData?.gunControl ?? null,
        }

        window.setInterval(() => this.pollGamepads(), 100);
    }

    pollGamepads() {
        this.setState({
            gamepads: navigator.getGamepads().filter((gamepad) => {
                return gamepad !== null
            }).map((gamepad) => {
                return gamepad as Gamepad;
            })
        });
    }

    getGamepad(id: string | undefined) {
        return id ? this.state.gamepads.find((gamepad) => { return gamepad.id === id }) ?? null : null;
    }

    setControl(key: string, ev: Event) {
        var target = ev.target as HTMLOptionElement;
        if (target !== null) {
            switch (key) {
                case 'pitch':
                    this.setState({ pitchControl: { id: target.value, axis: 0 } })
                    break;
                case 'roll':
                    this.setState({ rollControl: { id: target.value, axis: 0 } })
                    break;
                case 'thrust':
                    this.setState({ thrustControl: { id: target.value, axis: 0 } })
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

    saveData() {
        localStorage.setItem("fights-on-data", JSON.stringify({
            username: this.state.username,
            pitchControl: this.state.pitchControl,
            rollControl: this.state.rollControl,
            thrustControl: this.state.thrustControl
        }))
    }

    render() {
        return <div style={{
            position: "absolute",
            top: "calc(50% - 100px)",
            left: "calc(50% - 200px)",
            width: "400px",
            height: "200px",
            zIndex: 999
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
                    <input type="text"
                        style={{ width: "250px", marginLeft: "auto" }}
                        value={this.state.username}
                        onChange={(ev) => { this.setState({ username: ev.target.value }) }}
                    ></input>
                </div>
                <AxisSelector label="Pitch axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.getGamepad(this.state.pitchControl?.id)}
                    selectedAxis={this.state.pitchControl?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('pitch', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('pitch', ev)}
                ></AxisSelector>
                <AxisSelector label="Roll axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.getGamepad(this.state.rollControl?.id)}
                    selectedAxis={this.state.rollControl?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('roll', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('roll', ev)}
                ></AxisSelector>
                <AxisSelector label="Thrust axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.getGamepad(this.state.thrustControl?.id)}
                    selectedAxis={this.state.thrustControl?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setControl('thrust', ev)}
                    onAxisSelection={(ev: any) => this.setAxis('thrust', ev)}
                ></AxisSelector>

                <div style={{ display: "flex" }}>
                    <button style={{ marginLeft: "auto" }} onClick={() => { this.saveData(); this.props.onStart(this.state); }}>Start</button>
                </div>
            </div>
        </div>
    }
}