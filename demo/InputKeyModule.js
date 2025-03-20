import KVY from "./lib.js";

export class InputKeyModule extends KVY.CoreContextModule {
    keys = new Set();
    isKeyDown = (key) => this.keys.has(key);

    useCtx(ctx) {
        const onKeyDown = (e) => this.keys.add(e.code);
        const onKeyUp = (e) => this.keys.delete(e.code);

        const dom = ctx.three.renderer.domElement;
        dom.addEventListener("keydown", onKeyDown);
        dom.addEventListener("keyup", onKeyUp);

        return () => {
            dom.removeEventListener("keydown", onKeyDown);
            dom.removeEventListener("keyup", onKeyUp);
        }
    }
}