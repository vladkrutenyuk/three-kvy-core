import KVY from "./lib.js";

export class SimpleMovement extends KVY.Object3DFeature {
    speed = 2;

    constructor(object, props) {
        super(object);
        this.speed = props.speed || 2;
    }

    onBeforeRender(ctx) {
        const dp = this.speed * ctx.deltaTime;
        const pos = this.object.position;

        const key = ctx.modules.input.isKeyDown;

        if (key('KeyW')) pos.z -= dp;
        if (key('KeyS')) pos.z += dp;
        if (key('KeyD')) pos.x += dp;
        if (key('KeyA')) pos.x -= dp;
    }
}