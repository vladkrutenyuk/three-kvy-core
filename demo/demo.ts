import * as CANNON from "cannon-es";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import CannonPhysicsDebuggerGof from "../examples/features/CannonPhysicsDebuggerGof";
import OrbitCameraGof from "../examples/features/OrbitCameraGof";
import TestGof from "../examples/features/TestGof";
import CannonPhysicsModule from "../examples/modules/CannonPhysicsModule";
import InputSystemModule from "../examples/modules/InputSystemModule";
import NebulaParticlesModule from "../examples/modules/NebulaParticlesModule";
import ThreePostProcessingModule from "../examples/modules/ThreePostProcessingModule";
import { CPHModule } from "../src/core/BuiltInModulesRecords";
import { GameObject } from "../src/core/GameObject";
import { GameWorld } from "../src/core/GameWorld";

console.log("main.ts");

createWorld();
function createWorld() {
	const root = document.querySelector("#app");
	if (!root) return;

	const gameWorld = new GameWorld({
		modules: {
			cannon: new CannonPhysicsModule(),
			// nebula: new NebulaParticlesModule(),
			postprocessing: new ThreePostProcessingModule(),
			input: new InputSystemModule(),
		} as const,
		three: {
			rendererParams: {
				antialias: true,
				logarithmicDepthBuffer: true,
				preserveDrawingBuffer: true,
			},
		},
	});

	const { three, animationFrameLoop, modules } = gameWorld;
	const { postprocessing, cannon } = modules;

	postprocessing.setPixelRatio(window.devicePixelRatio);

	// setup postprocessing
	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2().setScalar(1),
		0.24,
		0.2,
		1.38
	);
	three.addEventListener("resize", (event) => {
		const { width, height } = event;
		bloomPass.resolution.set(width * 0.5, height * 0.5);
	});
	postprocessing.composer.insertPass(bloomPass, 1);

	// setup scene
	three.scene.background = new THREE.Color(0x202020);
	three.camera.position.setScalar(20);
	three.camera.lookAt(new THREE.Vector3().setScalar(0));

	gameWorld.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000));

	const cube = new THREE.Mesh(
		new THREE.BoxGeometry(),
		new THREE.MeshStandardMaterial({
			emissive: 0xffffff,
			emissiveIntensity: 4,
		})
	);
	gameWorld.add(cube);

	// start
	three.mount(root as HTMLDivElement);
	animationFrameLoop.run();

	// const go1 = new GameObject()
	// go1.addFeature(AudioGof, { mediaSrc: '/asdasd.ogg' })

	// // @ts-ignore
	// gameWorld.addFeature(CannonPhysicsDebuggerGof)
	const spawnRandomSphereBody = () => {
		const body = new CANNON.Body();
		body.addShape(
			new CANNON.Sphere(THREE.MathUtils.randFloat(0, 6)),
			new CANNON.Vec3(
				THREE.MathUtils.randFloat(-10, 10),
				0,
				THREE.MathUtils.randFloat(-10, 10)
			)
		);
		cannon.world.addBody(body);
	};

	const spawnRandomBoxBody = () => {
		const body = new CANNON.Body();
		const halfSize = THREE.MathUtils.randFloat(0, 6);
		const halfSizeVec = new CANNON.Vec3().set(halfSize, halfSize, halfSize);
		body.addShape(
			new CANNON.Box(halfSizeVec),
			new CANNON.Vec3(
				THREE.MathUtils.randFloat(-10, 10),
				0,
				THREE.MathUtils.randFloat(-10, 10)
			)
		);
		cannon.world.addBody(body);
	};

	// setTimeout(() => {
	//     cannonPhysicsDebuggerGof.remove()
	// }, 2000)

	const goo = new GameObject();
	gameWorld.add(goo);
	goo.addFeature(TestGof);

	const go2 = new GameObject<CPHModule>();
	gameWorld.add(go2);
	go2.addFeature(CannonPhysicsDebuggerGof);

	for (let i = 0; i < 3; i++) {
		spawnRandomSphereBody();
		spawnRandomBoxBody();
	}

	// gameWorld.traverse((x) => {
	// 	console.log('---', x.name, x.type)
	// })

	const go3 = new GameObject<{
		cannon: CannonPhysicsModule;
		nebula: NebulaParticlesModule;
	}>();
	//TODO resolve typescript issue with modules typings
	//@ts-ignore
	go3.addFeature(CannonPhysicsDebuggerGof);

	const planeBody = new CANNON.Body().addShape(new CANNON.Plane());
	cannon.world.addBody(planeBody);

	const go4 = new GameObject();
	go4.addFeature(OrbitCameraGof, {
		options: {
			maxDistance: 50,
			initDistance: 40,
			enablePan: true,
		},
	});
	gameWorld.add(go4);
	// setTimeout(() => {
	// 	//@ts-ignore
	// 	gameWorld.getFeature(CannonPhysicsDebuggerGof)?.destroy()
	// }, 1500)
}
