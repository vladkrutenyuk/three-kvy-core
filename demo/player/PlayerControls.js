import * as THREE from "three";
import KVY from "../lib.js";

export class PlayerControls extends KVY.CoreContextModule {
	constructor() {
		super();
	}

    /**
     * @param {KVY.CoreContext} ctx 
     */
    useCtx(ctx) {
        const dom = ctx.three.renderer.domElement;
        
    }

    jumped( ) {
        this.emit("jump")
    }
}
