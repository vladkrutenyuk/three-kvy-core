import * as CANNON from "cannon-es";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {CannonPhysicsDebuggerGof} from "../examples/features/CannonPhysicsDebuggerGof";
import {OrbitCameraGof} from "../examples/features/OrbitCameraGof";
import {TestGof} from "../examples/features/TestGof";
import {CannonPhysicsModule} from "../examples/modules/CannonPhysicsModule";
import {InputSystemModule} from "../examples/modules/InputSystemModule";
import {NebulaParticlesModule} from "../examples/modules/NebulaParticlesModule";
import {ThreePostProcessingModule} from "../examples/modules/ThreePostProcessingModule";
import { GameObject } from "../src/core/GameObject";
import { GameWorld } from "../src/core/GameWorld";
import { CPHModule } from "./BuiltInModulesRecords";

console.log("main.ts");

const root = document.querySelector("#app");
root && createWorld(root as HTMLDivElement);

function createWorld(root: HTMLDivElement) {
	const gameWorld = new GameWorld({
		modules: {
			cannon: new CannonPhysicsModule(),
			nebula: new NebulaParticlesModule(),
			postprocessing: new ThreePostProcessingModule(),
			input: new InputSystemModule(),
		} as const,
		three: {
			renderer: {
				antialias: true,
				logarithmicDepthBuffer: true,
				preserveDrawingBuffer: true,
			},
		},
	});

	const { three, animationFrameLoop, modules } = gameWorld;
	const { postprocessing, cannon, input } = modules;

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
	three.scene.background = new THREE.Color(0xaa2020);
	three.camera.position.setScalar(20);
	three.camera.lookAt(new THREE.Vector3().setScalar(0));

	gameWorld.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000));
	gameWorld.add(new GameObject());

	const cube = new THREE.Mesh(
		new THREE.BoxGeometry(),
		new THREE.MeshStandardMaterial({
			emissive: 0xffffff,
			emissiveIntensity: 4,
		})
	);
	gameWorld.add(cube);

	input.addRendererDomEventListener('click', (event) => {})
	
	// start
	three.mount(root as HTMLDivElement);
	animationFrameLoop.run();

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

	for (let i = 0; i < 3; i++) {
		spawnRandomSphereBody();
		spawnRandomBoxBody();
	}

	const planeBody = new CANNON.Body().addShape(new CANNON.Plane());
	cannon.world.addBody(planeBody);

	gameWorld
		.addFeature(OrbitCameraGof, {
			options: {
				maxDistance: 50,
				initDistance: 40,
				enablePan: true,
			},
		})
	gameWorld.addFeature(CannonPhysicsDebuggerGof);
	// gameWorld.create().addFeature(TestGof)
	const go = new GameObject()
	go.addFeature(TestGof)
	gameWorld.add(go)
}
