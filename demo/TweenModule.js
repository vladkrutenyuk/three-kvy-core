import KVY from "./KVY.js";

export class TweenModule extends KVY.CoreContextModule {
    /** @type {typeof import("three/addons/libs/tween.module.js")} */
    api;
    /** @param {typeof import("three/addons/libs/tween.module.js")} Tween */
    constructor(Tween) {
        super();
        this.api = Tween;
        console.log("TweenModule was inited with tween.js version", Tween.VERSION)
    }

    /**
     * 
     * @param {KVY.CoreContext} ctx 
     */
    useCtx(ctx) {
        const update = () => this.api.update();
        ctx.three.on("renderbefore", update)
        
        return () => {
            ctx.three.off("renderbefore", update)
            this.api.removeAll();
        }
    }
}