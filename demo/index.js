import * as THREE from "three";
import * as KVY from "../dist/index.js";
import { RotateOF } from "./RotateOF.js";
import { EventCache } from "../dist/index.js";
import { ExampleO3F } from "./ExampleO3F.js";

const c = new KVY.EventCache({jumped: {height:2}});
c.use("jumped")("height", 228)

KVY.Object3DFeature.log = (x, ...args) => console.log(`F-${x.id}`, ...args);
KVY.Object3DFeaturability.log = (x, ...args) => console.log(`OF-${x.object.id}`, ...args);

const ctx = KVY.GameContext.create(THREE, {}, { antialias: true });
ctx.featurability.addFeature(ExampleO3F);

const container = document.querySelector("#container");
ctx.mountAndRun(container);

const { scene, camera } = ctx.three;
scene.background = new THREE.Color("red");
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

const [cube, cubeF] = KVY.Object3DFeaturability.from(
	new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshMatcapMaterial())
).pair;
scene.add(cube);
cubeF.addFeature(RotateOF, {speed: 1});

const [sphere, sphereF] = KVY.Object3DFeaturability.from(
	new THREE.Mesh(new THREE.OctahedronGeometry(), new THREE.MeshMatcapMaterial())
).pair;
sphere.position.x = 2;
cube.add(sphere);
sphereF.addFeature(RotateOF);

const delay = (s = 0.5) => new Promise((res) => setTimeout(res, s * 1000));
(async function () {
	await delay();
	ctx.three.unmount();
	await delay();
	ctx.mountAndRun(container);
	await delay();
	// ctx.destroy();
	cubeF.getFeature(RotateOF)?.destroy()
	await delay();
	sphereF.destroyFeature(sphereF.getFeature(RotateOF));
	await delay();
	cube.removeFromParent();
	sphere.removeFromParent();
	await delay();
	sphere.add(cube);
	cube.position.x = -2;
	await delay();
	sphereF.addFeature(RotateOF);
	await delay();
	scene.add(sphere);
	await delay();
	cubeF.addFeature(RotateOF, {speed: 1});
	await delay();
	sphereF.getFeature(RotateOF)?.destroy()
	await delay();

})();
