import * as KVY from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";

export class CameraFollow extends KVY.Object3DFeature {
    constructor(object, props) {
        super(object);
        this.offset = props.offset;
        this.lookAtHeight = props.lookAtHeight;
    }

    useCtx(ctx) {
        const camera = ctx.three.camera;
        camera.position.copy(this.offset);
        camera.lookAt(new THREE.Vector3(0, this.lookAtHeight, 0));

        this.object.add(camera);

        return () => {
            this.object.remove(camera);
        }
    }

    onDestroy() {
        this.object.remove(camera);
    }
}