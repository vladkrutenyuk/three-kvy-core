import KVY from "./KVY.js";

export class SimpleMovement extends KVY.Object3DFeature {
    speed = 2;

    constructor(object, props) {
        super(object);
        this.speed = props.speed || 2;
    }

    onBeforeRender(ctx) {
        const dp = this.speed * ctx.deltaTime;
        const pos = this.object.position;

        const has = ctx.modules.keys.has;

        if (has('KeyW')) pos.z -= dp;
        if (has('KeyS')) pos.z += dp;
        if (has('KeyD')) pos.x += dp;
        if (has('KeyA')) pos.x -= dp;
    }
}