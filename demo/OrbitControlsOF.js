import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import KVY from "./KVY.js";

export class OrbitControlsOF extends KVY.Object3DFeature {
	constructor(object, props) {
		super(object);
        this.options = {
            enableDamping: true,
            dampingFactor: 0.25,
            enableZoom: true,
            enablePan: true,
            screenSpacePanning: false,
            maxPolarAngle: Math.PI / 2,
            minDistance: 1,
            maxDistance: 100,
            ...props.options
        };
	}

	useCtx(ctx) {
		const controls = new OrbitControls(
			ctx.three.camera,
			ctx.three.renderer.domElement
		);

        for (const key in this.options) {
            controls[key] = this.options[key];
        }

		controls.update();

		const update = () => {
			controls.update();
		};

		ctx.three.on("renderbefore", update);

		return () => {
			ctx.three.off("renderbefore", update);
		};
	}
}
