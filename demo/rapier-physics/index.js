import * as RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import * as TWEEN from "three/addons/libs/tween.module.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import {
	Collider,
	KeysInput,
	RapierDebugRenderer,
	RapierPhysics,
	RigidbodyDynamic,
	RigidbodyKinematic,
	SyncMode,
} from "../../addons/index.js";
import { CameraFollow } from "../CameraFollow.js";
import KVY from "../KVY.js";
import { TweenModule } from "../TweenModule.js";
import { KinematicController } from "./KinematicController.js";

const ctx = KVY.CoreContext.create(THREE, {}, { renderer: { antialias: true } });
ctx.three.mount(document.querySelector("#canvas-container"));
ctx.run();
const renderer = ctx.three.renderer;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

async function main() {
	await RAPIER.init();

	ctx.assignModules({
		keys: new KeysInput(),
		tween: new TweenModule(TWEEN),
		rapier: new RapierPhysics(RAPIER, { timeStep: "vary" }),
	});
	ctx.assignModule("debug", new RapierDebugRenderer());

	const terrain = createTerrain();
	ctx.root.add(terrain);

	const player = new THREE.Group().translateY(10);
	const scl = 0.95;
	const capsule = new THREE.Mesh(
		new THREE.CapsuleGeometry(0.5 * scl, 1.7 * scl),
		new THREE.MeshStandardMaterial({ color: 0x5060ff })
	);
	capsule.castShadow = true;
	player.add(capsule);
	KVY.addFeature(player, KinematicController, { offset: 0.03 });
	ctx.root.add(player);
	KVY.addFeature(player, CameraFollow, {
		offset: [0, 8 * 2, 10 * 2],
		lookAt: [0, 1.5, 0],
	});

	scene(ctx);
	for (let i = 0; i < 10; i++) {
		ctx.root.add(dynamicBox(i));
	}
	platform([4, 0.5, 4], [-3, 1, 3], [2, 1, 3]);
	platform([3, 0.5, 3], [3, 8, 0], [3, 0, 0]);
	platform([4, 0.4, 4], [-1, 4.5, -3], [4, 4.5, -3]);
}

class MoveablePaltform extends KVY.Object3DFeature {
	constructor(object, props) {
		super(object);
		this.from = new THREE.Vector3().fromArray(props?.from || [-1, 0, 0]);
		this.to = new THREE.Vector3().fromArray(props?.to || [1, 0, 0]);
	}

	useCtx(ctx) {
		/** @type {typeof import("three/addons/libs/tween.module.js")} Tween */
		const TWEEN = ctx.modules.tween.api;

		const pos = this.object.position;
		pos.copy(this.from);

		const _obj = new THREE.Vector3().copy(this.from);
		const tween = new TWEEN.Tween(_obj)
			.to(this.to, 1500)
			.onUpdate((obj) => {
				pos.copy(obj);
			})
			.repeat(Infinity)
			.yoyo(true)
			.repeatDelay(100) // 10 мс паузы перед началом нового цикла
			.start();

		return () => {
			tween.stop();
		};
	}
}

function platform(scale, from, to) {
	const box = prim("Box", [], 0xff3030);
	box.position.fromArray(from);
	box.receiveShadow = true;
	box.castShadow = true;
	box.scale.fromArray(scale);
	ctx.root.add(box);
	KVY.addFeature(box, MoveablePaltform, { from, to });
	KVY.addFeature(box, RigidbodyKinematic).setSyncMode(SyncMode.Body2Obj);
	KVY.addFeature(box, Collider, ["roundCuboid", ...scale.map((x) => x * 0.5), 0.1]);
	return box;
}

function createTerrain() {
	const heights = [];
	const nsubdivs = 100;
	const size = 50;
	const geometry = new THREE.PlaneGeometry(size, size, nsubdivs, nsubdivs);
	const noise = new SimplexNoise();
	const positions = geometry.getAttribute("position").array;
	const noiseSize = 0.02;
	for (let x = 0; x <= nsubdivs; x++) {
		for (let y = 0; y <= nsubdivs; y++) {
			const height = noise.noise(x * noiseSize, y * noiseSize) * 2;
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
	const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()).rotateX(
		-Math.PI / 2
	);
	mesh.receiveShadow = true;
	terrain.add(mesh);

	KVY.addFeature(terrain, Collider, [
		"heightfield",
		nsubdivs,
		nsubdivs,
		heights,
		scale,
	]);
	return terrain;
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
	const box = prim("Box", [], 0x808080);
	box.castShadow = true;
	box.position.set(rnds(10), rnd(1, 15), rnds(10));
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
