import * as THREE from "three";
import KVY from "./lib.js";

const g = { x: 0.0, y: -9.81, z: 0.0 };
export class RapierPhysics extends KVY.GameContextModule {
	debugRenderer;

	/** @type {typeof import("@dimforge/rapier3d-compat") | null} */
	RAPIER_API = null;

	/** @type {import("@dimforge/rapier3d-compat").World | null} */
	world = null;

	constructor(props) {
		super();
        /** @type {typeof import("@dimforge/rapier3d-compat")} */
		const RAPIER = props.RAPIER;
        this.RAPIER_API = RAPIER;
		if (RAPIER) {
			this.world = new RAPIER.World(g);
		}
	}

	onInit(ctx) {}

	/**
	 * @param {KVY.GameContext} ctx
	 */
	useCtx(ctx) {
		const world = this.world;
		if (!world) {
			console.error("RAPIER not found, world not created");
			return;
		}
		const scene = ctx.three.scene;
		const debugRenderer = new RapierDebugRenderer(scene, world);

		const update = () => {
			world.timestep = Math.min(ctx.deltaTime, 0.01);
			world.step();
			//TODO invoke step here
			debugRenderer.update();
		};

		ctx.three.on("renderbefore", update);

		return () => {
			ctx.three.off("renderbefore", update);
		};
	}
}

class RapierDebugRenderer {
	mesh;
	world;
	enabled = true;

	constructor(scene, world) {
		this.world = world;
		this.mesh = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
		);
		this.mesh.frustumCulled = false;
		scene.add(this.mesh);
	}

	update() {
		const mesh = this.mesh;
		const world = this.world;
		if (this.enabled) {
			const { vertices, colors } = world.debugRender();
			this.mesh.geometry.setAttribute(
				"position",
				new THREE.BufferAttribute(vertices, 3)
			);
			this.mesh.geometry.setAttribute(
				"color",
				new THREE.BufferAttribute(colors, 4)
			);
			this.mesh.visible = true;
		} else {
			this.mesh.visible = false;
		}
	}
}
