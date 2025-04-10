import * as THREE from "three";
import {
	CoreContextModule,
	CoreContext,
	ModulesRecordDefault,
	ReturnOfUseCtx,
} from "@vladkrutenyuk/three-kvy-core";
import { RapierPhysics } from "./RapierPhysics";

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RapierDebugRenderer.ts | Source}
 */
export class RapierDebugRenderer extends CoreContextModule {
	private _lines?: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;

	get enabled() {
		return this._enabled;
	}
	set enabled(value: boolean) {
		const lines = this._lines;
		if (lines) lines.visible = value;
		this._enabled = value;
	}

	private _enabled = true;

	protected useCtx(ctx: CoreContext<ModulesRecordDefault>): ReturnOfUseCtx {
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) return;

		const lines = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
		);
		lines.frustumCulled = false;
		lines.visible = this._enabled;
		ctx.three.scene.add(lines);

		const draw = () => {
			const { vertices, colors } = rapier.world.debugRender();
			lines.geometry.setAttribute(
				"position",
				new THREE.BufferAttribute(vertices, 3)
			);
			lines.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
			lines.visible = true;
		};

		rapier.on("stepafter", draw);
		// ctx.three.on("renderbefore", draw);
		
		return () => {
			this._lines = undefined;
			lines.removeFromParent();
			lines.geometry.dispose();
			lines.material.dispose();
			// ctx.three.off("renderbefore", draw);
			rapier.off("stepafter", draw);
		};
	}
}
