import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Kvy4 from "./lib.js";

export class OrbitControlsOF extends Kvy4.Object3DFeature {
	constructor(props) {
		super(props);
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
