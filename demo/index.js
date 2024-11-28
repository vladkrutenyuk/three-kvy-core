import * as THREE from "three";
import * as KVY from "../dist/esm/index.js";
import { RotateOF } from "./RotateOF.js";
console.log('start', {THREE,KVY})
KVY.Object3DFeature.log = (x, ...args) => console.log(`F-${x.id}`, ...args);
KVY.Object3DFeaturability.log = (x, ...args) => console.log(`OF-${x.ref.id}`, ...args);

const ctx = KVY.GameContext.create(THREE, {}, { antialias: true });

const container = document.querySelector("#container");
ctx.mountAndRun(container);

const { scene, camera } = ctx.three;
scene.background = new THREE.Color("red");

const cubeF = KVY.Object3DFeaturability.from(
	new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshMatcapMaterial())
);
scene.add(cubeF.ref);


cubeF.addFeature(RotateOF);

camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

// setTimeout(() => {
//     ctx.three.unmount();
//     setTimeout(() => {
//         ctx.three.mount(container);
//         ctx.destroy();
//     }, 1000)
// }, 1000)
