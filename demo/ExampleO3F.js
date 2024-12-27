import Kvy4 from "./lib.js";

export class ExampleO3F extends Kvy4.Object3DFeature {
    onLoopRun(ctx) {
        console.log("LOOP RUN")
    }
    onLoopStop(ctx) {
        console.log("LOOP STOP")
    }
    onResize() {
        console.log("onResize")
    }
}
