import * as THREE from "three";
import type * as RAPIER from "@dimforge/rapier3d-compat";

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RapierDebugRenderer.ts | Source}
 */
export class RapierDebugRenderer {
	private _lines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
	private _world: RAPIER.World;

    get enabled() {
        return this._lines.visible
    }
    set enabled(value: boolean) {
        this._lines.visible = value;
    }

	constructor(parent: THREE.Object3D, world: RAPIER.World) {
		this._world = world;
		this._lines = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
		);
		this._lines.frustumCulled = false;
		parent.add(this._lines);
	}

	draw() {
		const lines = this._lines;
        if (!lines.visible) return;

		const world = this._world;
		const { vertices, colors } = world.debugRender();
		lines.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
		lines.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
		lines.visible = true;
	}

	destroy() {
        const lines = this._lines;
        lines.removeFromParent();
        lines.geometry.dispose();
        lines.material.dispose();
    }
}
