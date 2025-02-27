import KVY from "./lib.js";

export class ExampleO3F extends KVY.Object3DFeature {
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
