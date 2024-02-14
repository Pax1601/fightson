export abstract class Effect  {
    x: number;
    y: number;

    /* Static members and methods */ 
    static effects: Effect[] = [];

    /** Add a new effect
     * 
     * @param effect Effect to add
     */
    static addEffect(effect: Effect) {
        Effect.effects.push(effect);
    }

    /** Remove existing effect
     * 
     * @param effect Effect to remove
     */
    static removeEffect(effect: Effect) {
        Effect.effects = Effect.effects.filter((existingEffect) => {return effect !== existingEffect})
    }

    /** Get all the effects
     * 
     * @returns All the registered effects
     */
    static getAll() {
        return Effect.effects;
    }

    constructor(x: number, y: number) {
        Effect.addEffect(this);
        this.x = x;
        this.y = y;
    }

    /** Draw the effect
     * 
     * @param ctx Canvas Rendering Context. 
     * @param x X coordinate position where the effect must be drawn
     * @param y Y coordinate position where the effect must be drawn
     * @param dt Time since last frame, in seconds
     */
    abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, dt: number): void;
}