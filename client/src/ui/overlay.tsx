import { Component } from "react";

export interface OverlayProps {
    bullets: number;
    missiles: number;
    throttle: number;
    speed: number;
    fuel: number;
    flares: number;
}

export class Overlay extends Component<OverlayProps, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <div style={{
            position: "absolute",
            zIndex: 999
        }}>
             <div style={{
                display: "flex",
                flexDirection: "column",
                position: "absolute",
                top: "25px",
                left: "25px",
                width: "300px",
                color: "white",
                textShadow: "1px 1px 0px black"
             }}>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>THROTTLE: </span><span> {Math.round(this.props.throttle * 100)}%</span></div>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>SPEED: </span><span>{Math.round(this.props.speed)}</span></div>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>FUEL: </span><span>{this.props.fuel > 0 ? Math.round(this.props.fuel) + "%": "REFUELING"}</span></div>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>FLARES: </span><span>{this.props.flares > 0? Math.round(this.props.flares): "RELOADING"}</span></div>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>BULLETS: </span><span>{this.props.bullets > 0? Math.round(this.props.bullets): "RELOADING"}</span></div>
                <div style={{display: "flex"}}><span style={{width: "150px"}}>MISSILES: </span><span>{this.props.missiles > 0? Math.round(this.props.missiles): "RELOADING"}</span></div>
             </div>

        </div>
    }

}

