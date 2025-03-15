import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class InputKeyModule extends KVY.GameContextModule {
    keys = new Set();
    isKeyDown = (key) => this.keys.has(key);

    useCtx(ctx) {
        const onKeyDown = (e) => this.keys.add(e.code);
        const onKeyUp = (e) => this.keys.delete(e.code);
        const onBlur = () => this.keys.clear();

        const dom = ctx.three.renderer.domElement;
        dom.addEventListener("keydown", onKeyDown);
        dom.addEventListener("keyup", onKeyUp);
        dom.addEventListener("blur", onBlur);

        return () => {
            dom.removeEventListener("keydown", onKeyDown);
            dom.removeEventListener("keyup", onKeyUp);
            dom.removeEventListener("blur", onBlur);
        }
    }
}