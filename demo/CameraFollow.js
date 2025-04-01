import KVY from "./lib.js";
import * as THREE from "three";

export class CameraFollow extends KVY.Object3DFeature {
    constructor(object, props) {
        super(object);
        this.offset = props.offset;
        this.lookAt = props.lookAt;
    }

    /** @param {KVY.CoreContext} ctx */
    useCtx(ctx) {
        const camera = ctx.three.camera;
        camera.position.fromArray(this.offset);
        const lookAt = new THREE.Vector3().fromArray(this.lookAt)
        camera.lookAt(lookAt);
        console.log(lookAt, this.offset,this.lookAt)
        
        this.object.add(camera);

        return () => {
            this.object.remove(camera);
        }
    }
}