import { GameContext } from "../dist/index.js";
import { Object3DFeature } from "../dist/index.js";

export class ExampleO3F extends Object3DFeature {
	constructor(props) {
		super(props);
        this.useThreeEventHandler("resize", "onResize")
        // this.useEventHandler("resize", "onResize")
	}

    /** @param {GameContext} ctx */
    useCtx(ctx) {
        // this.useEventHandler(ctx.animationFrameLoop, "run", "onLoopRun")
        // this.useEventHandler(ctx.animationFrameLoop, "stop", "onLoopStop")
    }
    onLoopRun(ctx) {
        console.log("LOOP RUN")
    }
    onLoopStop(ctx) {
        console.log("LOOP STOP")
    }
    onResize(ctx) {
        console.log("resize")
    }
}
