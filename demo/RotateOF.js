import KVY from "./lib.js";

export class RotateOF extends KVY.Object3DFeature {
    speed = 5;
    constructor(object, props) {
        super(object);
        this.speed = props.speed ?? 5;
    }

    /** @param {KVY.GameContext} ctx */
    onBeforeRender(ctx) {
        this.object.rotation.y += ctx.deltaTime * this.speed;
    }
}