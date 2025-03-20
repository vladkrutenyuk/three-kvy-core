import * as THREE from "three";
import KVY from "./lib.js";
import { RotateOF } from "./RotateOF.js";
import { ExampleO3F } from "./ExampleO3F.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { OrbitControlsOF } from "./OrbitControlsOF.js";
import { RigidbodyDynamicOF } from "./RigidbodyDynamicOF.js";
import { ColliderOF } from "./ColliderOF.js";
import { InputKeyModule } from "./InputKeyModule.js";
import { SimpleMovement } from "./SimpleMovement.js";

KVY.Object3DFeature.log = (x, ...args) => console.log(`F-${x.id}`, ...args);
// KVY.Object3DFeaturability.log = (x, ...args) =>
// 	console.log(`OBJ-${x.object.id}`, ...args);
var RAPIER = window.RAPIER;
const rapier = new RapierPhysics({ RAPIER: RAPIER });
const input = new InputKeyModule();
const ctx = KVY.CoreContext.create(THREE, { rapier, input }, { antialias: true });
const container = document.querySelector("#canvasContainer");
ctx.three.mount(container);
ctx.run();

class CustomTickModule extends KVY.CoreContextModule {
	useCtx() {
		const interval = setInterval(() => {
			this.emit("customtick");
		}, 2000);

		return () => clearInterval(interval);
	}
}

ctx.assignModules({ tick: new CustomTickModule() });

class SpinningToFro extends KVY.Object3DFeature {
	speed = 1;

	useCtx(ctx) {
		console.log("SpinningToFro: ctx attached", this.object);
		const onTick = () => {
			this.speed *= -1;
		};

		const tick = ctx.modules.tick;
		tick.on("customtick", onTick);

		return () => {
			console.log("SpinningToFro: ctx detached");
			tick.off("customtick", onTick);
		};
	}

	onBeforeRender(ctx) {
		const angle = this.speed * ctx.deltaTime;
		this.object.rotateX(angle);
		this.object.rotateY(angle);
	}
}

const scube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
scube.position.z = 2;
ctx.root.add(scube);

KVY.addFeature(scube, SpinningToFro);

ctx.run();
const { scene, camera } = ctx.three;
const offsetRoot = new THREE.Group();
offsetRoot.rotateX(0.2);
offsetRoot.rotateZ(0.4);
offsetRoot.position.set(-2, 1, -2);
scene.add(offsetRoot);

const _root = new THREE.Group();
KVY.addFeature(ctx.root, ExampleO3F);
KVY.addFeature(ctx.root, OrbitControlsOF);
const world = ctx.modules.rapier.world;

let groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.1, 5.0);
world.createCollider(groundColliderDesc);

// Create a dynamic rigid-body.
let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0.0, 2.0, 0.0);
let rigidBody = world.createRigidBody(rigidBodyDesc);

// Create a cuboid collider attached to the dynamic rigidBody.
let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
let collider = world.createCollider(colliderDesc, rigidBody);

const physicalCube = new THREE.Mesh(
	new THREE.BoxGeometry(),
	new THREE.MeshMatcapMaterial({ color: 0x448888 })
);

const knag = new THREE.Mesh(
	new THREE.BoxGeometry(0.2, 0.2, 0.2),
	new THREE.MeshMatcapMaterial()
);
physicalCube.add(knag);
knag.position.set(0.5, 0.5, 0.5);
physicalCube.position.set(-0.6, 3, -0.6);

offsetRoot.add(physicalCube);
KVY.addFeature(physicalCube, RigidbodyDynamicOF);
KVY.addFeature(physicalCube, ColliderOF);

scene.background = new THREE.Color("#202020");
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshMatcapMaterial());
scene.add(cube);
KVY.addFeature(cube, RotateOF, { speed: 1 });

const octah = new THREE.Mesh(
	new THREE.OctahedronGeometry(),
	new THREE.MeshMatcapMaterial()
);
KVY.addFeature(octah, SimpleMovement, { speed: 2 });

// sphereF.object === sphere;
// sphere.userData.featurability === sphereF;

octah.position.x = 2;
cube.add(octah);
KVY.addFeature(octah, RotateOF);

const sphere = new THREE.Mesh(
	new THREE.OctahedronGeometry(undefined, 2),
	new THREE.MeshMatcapMaterial({ flatShading: true })
);
sphere.position.x = -2;
scene.add(sphere);

const delay = (s = 0.1) => new Promise((res) => setTimeout(res, s * 1000));
(async function () {
	ctx.three.mount(container);
	ctx.run();

	await delay();

	await delay();
	// ctx.destroy();
	KVY.getFeature(cube, RotateOF)?.destroy();
	await delay();
	KVY.getFeature(octah, RotateOF)?.destroy();
	await delay();
	KVY.addFeature(sphere, RotateOF);
	// Kvy4.Object3DFeaturability.from(sphere).addFeature(RotateOF);
	await delay();
	cube.removeFromParent();
	octah.removeFromParent();
	await delay();
	octah.add(cube);
	cube.position.x = -2;
	await delay();
	KVY.addFeature(octah, RotateOF);
	await delay();
	scene.add(octah);
	await delay();
	KVY.addFeature(cube, RotateOF, { speed: 1 });
	await delay();
	KVY.getFeature(octah, RotateOF)?.destroy();
	await delay();

	await delay();
	ctx.three.unmount();
	await delay();
	ctx.three.mount(container);
	ctx.run();
	await delay();
	// const physicalCubeFeatures = KVY.getFeatures(physicalCube);
	// physicalCubeFeatures.forEach((f) => f.destroy());
	// await delay();

	// ctx.destroy();

	ctx.removeModule("tick");
	await delay(1);
	

	await delay(2);
	ctx.destroy();
	await delay();
	KVY.addFeature(cube, RotateOF, { speed: 1 });
	await delay(1);

	//TODO why eveyrthing from rapier is not destroyed
	const ctx2 = KVY.CoreContext.create(THREE, { input }, { antialias: true });
	ctx2.three.mount(container);
	ctx2.run();
	ctx2.root.add(cube);
	KVY.addFeature(ctx2.root, OrbitControlsOF);
	ctx2.three.scene.background = new THREE.Color("#101010");
	ctx2.three.scene.add(new THREE.GridHelper());
	ctx2.three.camera.position.set(5, 5, 5);
	ctx2.three.camera.lookAt(new THREE.Vector3());

	await delay(2);

	KVY.clear(ctx2.root, true);
})();
