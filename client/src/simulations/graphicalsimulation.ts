import { Simulation } from "./simulation";

export abstract class GraphicalSimulation extends Simulation {
    /* Static members and methods */
    static simulations: GraphicalSimulation[] = [];

    /** Add a new graphical simulation element
     * 
     * @param simulation Graphical simulation element to register
     */
    static addGraphicalSimulation(simulation: GraphicalSimulation) {
        GraphicalSimulation.simulations.push(simulation);
    }

     /** Remove a graphical simulation element
     * 
     * @param simulation Graphical simulation element to register
     */
     static removeSimulation(simulation: GraphicalSimulation) {
        GraphicalSimulation.simulations = GraphicalSimulation.simulations.filter((existingSimulation) => {return existingSimulation === simulation;});
    }

    /** Returns a graphical simulation element by uuid
     * 
     * @param uuid Uuid to search for
     * @returns If found, the graphical simulation element
     */
    static getByUUID(uuid: string) {
        return GraphicalSimulation.simulations.find((simulation) => {return simulation.uuid === uuid;})
    }

    /** Returns all the graphical simulations of a certain type
     * 
     * @param type Type to search for
     * @returns Array of graphical simulation elements
     */
    static getAllByType(type: string) {
        return GraphicalSimulation.simulations.filter((simulation) => {return typeof simulation === type});
    }

    constructor(uuid: string | undefined = undefined) {
        super(uuid);

        GraphicalSimulation.addSimulation(this);
    }

    /** Draw the graphical element
     * 
     * @param ctx Canvas Rendering Context. 
     * @param x X coordinate position where the element must be drawn
     * @param y Y coordinate position where the element must be drawn
     * @param dt Time since last frame, in seconds
     */
    abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, dt: number): void;
} 