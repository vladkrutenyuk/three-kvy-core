import * as THREE from "three";
import KVY from "./lib.js";
import { RotateOF } from "./RotateOF.js";
import { ExampleO3F } from "./ExampleO3F.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { OrbitControlsOF } from "./OrbitControlsOF.js";
import { RigidbodyDynamicOF } from "./RigidbodyDynamicOF.js";
import { ColliderOF } from "./ColliderOF.js";

KVY.Object3DFeature.log = (x, ...args) => console.log(`F-${x.id}`, ...args);
KVY.Object3DFeaturability.log = (x, ...args) => console.log(`OF-${x.object.id}`, ...args);
var RAPIER = window.RAPIER;
const rapier = new RapierPhysics({ RAPIER: RAPIER });
const ctx = KVY.GameContext.create(THREE, { rapier }, { antialias: true });
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

const container = document.querySelector("#container");

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

const delay = (s = 0.5) => new Promise((res) => setTimeout(res, s * 1000));
(async function () {
	ctx.mountAndRun(container);

	await delay();

	await delay();
	// ctx.destroy();
	KVY.getFeature(cube, RotateOF)?.destroy();
	await delay();
	KVY.destroyFeature(octah, KVY.getFeature(octah, RotateOF));
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
	ctx.mountAndRun(container);
	await delay();
	const physicalCubeFeatures = KVY.getFeatures(physicalCube);
	physicalCubeFeatures.forEach((f) => f.destroy());
})();
