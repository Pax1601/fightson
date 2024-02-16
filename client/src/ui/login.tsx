import { Component } from "react";

export interface LoginProps {
    onStart: CallableFunction
}

export interface LoginState {
    username: string
}

export interface CookieData {
    username: string
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
            username: this.cookieData?.username ?? ""
        }
    }

    /** Save the selected data to local storage
     * 
     */
    saveData() {
        localStorage.setItem("fights-on-data", JSON.stringify({
            username: this.state.username
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
                
                <div style={{ display: "flex" }}>
                    <button style={{ marginLeft: "auto", marginTop: "20px"}} onClick={() => { this.saveData(); this.props.onStart(this.state); }}>Start</button>
                </div>
            </div>
        </div>
    }
}
