import * as THREE from "three";
import * as TWEEN from "three/addons/libs/tween.module.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import { CameraFollow } from "../CameraFollow.js";
import { InputKeyModule } from "../InputKeyModule.js";
import KVY from "../lib.js";
import { TweenModule } from "../TweenModule.js";
import { Collider } from "./Collider.js";
import { KinematicController } from "./KinematicController.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { RigidbodyDynamic } from "./RigidbodyDynamic.js";
import { RigidbodyKinematic, SyncMode } from "./RigidbodyKinematic.js";

const ctx = KVY.CoreContext.create(THREE, {}, { renderer: { antialias: true } } );
ctx.three.mount(document.querySelector("#canvas-container"));
ctx.run();
const renderer = ctx.three.renderer;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

async function main() {
	/** @type {typeof import("@dimforge/rapier3d-compat")} */
	const RAPIER = await import("https://cdn.skypack.dev/@dimforge/rapier3d-compat");
	window.RAPIER = RAPIER;
	await RAPIER.init();

	ctx.assignModule("input", new InputKeyModule());
	ctx.assignModule("rapier", new RapierPhysics(RAPIER));
	ctx.assignModule("tween", new TweenModule(TWEEN));

	const heights = [];
	const nsubdivs = 100;
	const size = 50;
	const geometry = new THREE.PlaneGeometry(size, size, nsubdivs, nsubdivs);
	const noise = new SimplexNoise();
	const positions = geometry.getAttribute("position").array;
	const noiseSize = 0.02;
	for (let x = 0; x <= nsubdivs; x++) {
		for (let y = 0; y <= nsubdivs; y++) {
			const height = noise.noise(x * noiseSize, y * noiseSize) * 4;
			const vertIndex = (x + (nsubdivs + 1) * y) * 3;
			positions[vertIndex + 2] = height;
			const heightIndex = y + (nsubdivs + 1) * x;
			heights[heightIndex] = height;
		}
	}
	// needed for lighting
	geometry.computeVertexNormals();
	const scale = new RAPIER.Vector3(size, 1, size);

	const terrain = new THREE.Group();
	const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
		.translateY(0.05)
		.rotateX(-Math.PI / 2);
	mesh.receiveShadow = true;
	terrain.add(mesh);

	KVY.addFeature(terrain, Collider, [
		"heightfield",
		nsubdivs,
		nsubdivs,
		heights,
		scale,
	]);
	ctx.root.add(terrain);

	const player = new THREE.Group().translateY(10);
	const scl = 0.95;
	const capsule = new THREE.Mesh(
		new THREE.CapsuleGeometry(0.5 * scl, 1.7 * scl),
		new THREE.MeshStandardMaterial()
	);
	capsule.castShadow = true;
	player.add(capsule);
	KVY.addFeature(player, KinematicController, { offset: 0.03 });
	ctx.root.add(player);
	KVY.addFeature(player, CameraFollow, {
		offset: [0, 8 * 2, 10 * 2],
		lookAt: [0, 1.5, 0],
	});

	camera(ctx);
	scene(ctx);
	for (let i = 0; i < 10; i++) {
		ctx.root.add(dynamicBox(i));
	}
	const platform = prim("Box", [], 0x9090ff).translateY(3.5);
	platform.receiveShadow = true;
	platform.castShadow = true;
	platform.scale.set(4, 0.5, 4);
	ctx.root.add(platform);
	KVY.addFeature(platform, MoveablePaltform);
	KVY.addFeature(platform, RigidbodyKinematic).setSyncMode(SyncMode.Body2Obj);
	KVY.addFeature(platform, Collider, ["roundCuboid", 2, 0.25, 2, 0.1]);
}

class MoveablePaltform extends KVY.Object3DFeature {
	useCtx(ctx) {
		/** @type {typeof import("three/addons/libs/tween.module.js")} Tween */
		const TWEEN = ctx.modules.tween.api;
		const pos = this.object.position;
		pos.x = -2;
		const tween = new TWEEN.Tween(pos)
			.to({ x: 2 }, 1500)
			.repeat(Infinity)
			.yoyo(true)
			.repeatDelay(100) // 10 мс паузы перед началом нового цикла
			.start();

		return () => {
			tween.stop();
		};
	}
}

/**
 * @param {KVY.CoreContext} ctx
 */
function camera(ctx) {
	const camera = ctx.three.camera;
	// const orbitControls = new OrbitControls(
	// 	ctx.three.camera,
	// 	ctx.three.renderer.domElement
	// );
	// camera.position.set(15, 15, 15);
	// camera.lookAt(new THREE.Vector3());
	// orbitControls.update();
}

/**
 * @param {KVY.CoreContext} ctx
 */
function scene(ctx) {
	const scene = ctx.three.scene;
	scene.background = new THREE.Color(0x303030);
	const light = new THREE.DirectionalLight();
	light.position.setScalar(5);
	// light.position.x = 20;
	scene.add(light);

	light.castShadow = true;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;
	// light.shadow.camera.near = 0.5;
	// light.shadow.camera.far = 500;

	const d = 30;

	light.shadow.camera.left = -d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = -d;

	const amblight = new THREE.AmbientLight();
	amblight.intensity = 0.5;
	scene.add(amblight);
}

const rnd = THREE.MathUtils.randFloat;
const rnds = THREE.MathUtils.randFloatSpread;
function dynamicBox() {
	/** @type {typeof import("@dimforge/rapier3d-compat")} */
	const RAPIER = window.RAPIER;
	const box = prim("Box", [], 0xaaaaaa);
	box.castShadow = true;
	box.position.set(rnds(10), rnd(1, 6), rnds(10));
	box.rotation.set(rnds(Math.PI), rnds(Math.PI), rnds(Math.PI));

	KVY.addFeature(box, RigidbodyDynamic);
	KVY.addFeature(box, Collider, ["roundCuboid", 0.5, 0.5, 0.5, 0.1]).set((c) => {
		c.setMass(1);
	});

	return box;
}
const classes = {
	Box: THREE.BoxGeometry,
	Cone: THREE.ConeGeometry,
	Plane: THREE.PlaneGeometry,
	Sphere: THREE.SphereGeometry,
	Capsule: THREE.CapsuleGeometry,
	Cylinder: THREE.CylinderGeometry,
	Icosahedron: THREE.IcosahedronGeometry,
	Tetrahedron: THREE.TetrahedronGeometry,
	Dodecahedron: THREE.DodecahedronGeometry,
};

/**
 *
 * @param {{keyof typeof classes}} type
 * @param {*} args
 * @returns {THREE.Mesh}
 */
function prim(type, args, color) {
	return new THREE.Mesh(
		new classes[type](...args),
		new THREE.MeshStandardMaterial({ color })
	);
}

main();
