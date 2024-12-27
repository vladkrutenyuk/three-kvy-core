import Kvy4 from "./lib.js";

export class RotateOF extends Kvy4.Object3DFeature {
    speed = 5;
    constructor(object, props) {
        super(object);
        this.speed = props.speed ?? 5;
        console.log('new RotateOF');
        // this.useThreeEventHandler("renderafter", "onUpdate")
    }

    // /** @param {KVY.GameContext} ctx */
    // useCtx(ctx) {
    //     console.log('useCtx');
    //     ctx.three.on("renderbefore", this.onUpdate, this)
    //     return () => {
    //         ctx.three.off("renderbefore", this.onUpdate, this)
    //         console.log('useCtx return;');
    //     }
    // }

    /** @param {Kvy4.GameContext} ctx */
    onBeforeRender(ctx) {
        // console.log("onBeforeRender")
        this.object.rotation.y += ctx.deltaTime * this.speed;
    }
}