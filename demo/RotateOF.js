import * as KVY from "../dist/index.js";

export class RotateOF extends KVY.Object3DFeature {
    speed = 5;
    constructor(props) {
        super(props);
        this.speed = props.speed ?? 5;
        console.log('new RotateOF');
        this.useThreeEventHandler("renderafter", "onUpdate")
    }

    /** @param {KVY.GameContext} ctx */
    useCtx(ctx) {
        console.log('useCtx');
        
        return () => {
            console.log('useCtx return;');
        }
    }

    /** @param {KVY.GameContext} ctx */
    onUpdate(ctx) {
        console.log("update")
        this.object.rotation.y += ctx.deltaTime * this.speed;
    }
}