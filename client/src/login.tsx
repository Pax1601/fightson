import { Component } from "react";

export interface LoginProps {
    onStart: CallableFunction
}

export interface LoginState {
    username: string,
    gamepads: Gamepad[],
    pitchGamepad: { id: string, axis: number } | null,
    rollGamepad: { id: string, axis: number } | null,
    thrustGamepad: { id: string, axis: number } | null,
    gunGamepad: { id: string, button: number } | null
}

export interface CookieData {
    username: string,
    pitchGamepad: { id: string, axis: number } | null,
    rollGamepad: { id: string, axis: number } | null,
    thrustGamepad: { id: string, axis: number } | null,
    gunGamepad: { id: string, button: number } | null
}

/** React component for the login and input selection screen
 * 
 */
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

        /* Set the initial state */
        this.state = {
            username: this.cookieData?.username ?? "",
            gamepads: [],
            pitchGamepad: this.cookieData?.pitchGamepad ?? null,
            rollGamepad: this.cookieData?.rollGamepad ?? null,
            thrustGamepad: this.cookieData?.thrustGamepad ?? null,
            gunGamepad: this.cookieData?.gunGamepad ?? null,
        }

        window.setInterval(() => this.pollGamepads(), 100);
    }

    /** Periodically poll the navigator to check for the presence of gamepads
     * 
     */
    pollGamepads() {
        this.setState({
            gamepads: navigator.getGamepads().filter((gamepad) => {
                return gamepad !== null
            }).map((gamepad) => {
                return gamepad as Gamepad;
            })
        });
    }

    /** Get Gamepad by ID
     * 
     * @param id String id of the gamepad to retrieve
     * @returns If found, the required Gamepad, otherwise null
     */
    getGamepad(id: string | undefined) {
        return id ? this.state.gamepads.find((gamepad) => { return gamepad.id === id }) ?? null : null;
    }

    /** Set the currently selected gamepad for a specific axis
     * 
     * @param key String, the axis to set
     * @param id String, the id of the gamepad
     */
    setGamepad(key: string, id: string) {
        switch (key) {
            case 'pitch':
                this.setState({ pitchGamepad: { id: id, axis: 0 } })
                break;
            case 'roll':
                this.setState({ rollGamepad: { id: id, axis: 0 } })
                break;
            case 'thrust':
                this.setState({ thrustGamepad: { id: id, axis: 0 } })
                break;
        }
    }

    /** Set the currently axis for an input gamepad
     * 
     * @param key String, the axis to set
     * @param value String, the axis value
     */
    setAxis(key: string, value: string) {
        var axis = Number(value);
        switch (key) {
            case 'pitch':
                if (this.state.pitchGamepad)
                    this.state.pitchGamepad.axis = axis;
                this.setState(this.state);
                break;
            case 'roll':
                if (this.state.rollGamepad)
                    this.state.rollGamepad.axis = axis;
                this.setState(this.state);
                break;
            case 'thrust':
                if (this.state.thrustGamepad)
                    this.state.thrustGamepad.axis = axis;
                this.setState(this.state);
                break;
        }
    }

    /** Save the selected data to local storage
     * 
     */
    saveData() {
        localStorage.setItem("fights-on-data", JSON.stringify({
            username: this.state.username,
            pitchGamepad: this.state.pitchGamepad,
            rollGamepad: this.state.rollGamepad,
            thrustGamepad: this.state.thrustGamepad
        }))
    }

    render() {
        return <div style={{
            content: "",
            backgroundColor: "#181e25",
            color: "#FAFAFA",
            fontWeight: "600",
            width: "100%",
            height: "100%",
            zIndex: 999
        }}>
            <div style={{
                position: "absolute",
                top: "50px",
                left: "calc(50% - 150px)",
                width: "300px",
                height: "fit-content",
                zIndex: 999
            }}><img src="client/img/background/767-Bird.png"></img></div>
            <div style={{
                position: "absolute",
                top: "300px",
                left: "calc(50% - 250px)",
                width: "500px",
                height: "fit-content",
                zIndex: 999,
                fontSize: "70px",
                fontWeight: "800",
                textAlign: "center"
            }}>FIGHT'S ON</div>
            <div style={{
                position: "absolute",
                top: "450px",
                left: "calc(50% - 200px)",
                width: "400px",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                rowGap: "5px",
                zIndex: 999
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
                    selectedGamepad={this.getGamepad(this.state.pitchGamepad?.id)}
                    selectedAxis={this.state.pitchGamepad?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setGamepad('pitch', ev.target.value)}
                    onAxisSelection={(ev: any) => this.setAxis('pitch', ev.target.value)}
                ></AxisSelector>
                <AxisSelector label="Roll axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.getGamepad(this.state.rollGamepad?.id)}
                    selectedAxis={this.state.rollGamepad?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setGamepad('roll', ev.target.value)}
                    onAxisSelection={(ev: any) => this.setAxis('roll', ev.target.value)}
                ></AxisSelector>
                <AxisSelector label="Thrust axis"
                    gamepads={this.state.gamepads}
                    selectedGamepad={this.getGamepad(this.state.thrustGamepad?.id)}
                    selectedAxis={this.state.thrustGamepad?.axis ?? null}
                    onGamepadSelection={(ev: any) => this.setGamepad('thrust', ev.target.value)}
                    onAxisSelection={(ev: any) => this.setAxis('thrust', ev.target.value)}
                ></AxisSelector>

                <div style={{ display: "flex" }}>
                    <button style={{ marginLeft: "auto", marginTop: "20px"}} onClick={() => { this.saveData(); this.props.onStart(this.state); }}>Start</button>
                </div>
            </div>
        </div>
    }
}

/** Simple Axis Selector component
 * 
 */
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