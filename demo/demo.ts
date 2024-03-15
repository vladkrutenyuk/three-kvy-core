import * as CANNON from "cannon-es";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { CannonPhysicsDebuggerGof } from "../examples/features/CannonPhysicsDebuggerGof";
import { OrbitCameraGof } from "../examples/features/OrbitCameraGof";
import { TestGof } from "../examples/features/TestGof";
import { CannonPhysicsModule } from "../examples/modules/CannonPhysicsModule";
import { InputSystemModule } from "../examples/modules/InputSystemModule";
import { NebulaParticlesModule } from "../examples/modules/NebulaParticlesModule";
import { ThreePostProcessingModule } from "../examples/modules/ThreePostProcessingModule";
import { GameContext } from "../src/core/GameContext";
import { ObjectFeaturability } from "../src/core/ObjectFeaturablity";

console.log("main.ts");

const root = document.querySelector("#app");
root && createWorld(root as HTMLDivElement);

function createWorld(root: HTMLDivElement) {
	const gameCtx = new GameContext({
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
		autoRenderOnFrame: true,
	});

	const { three, animationFrameLoop, modules } = gameCtx;
	const { postprocessing, cannon, input } = modules;

	postprocessing.setPixelRatio(window.devicePixelRatio);

	// setup postprocessing
	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2().setScalar(1),
		0.24,
		0.2,
		1.38
	);
	three.addEventListener("resize", ({ width, height }) => {
		bloomPass.setSize(width, height);
	});
	postprocessing.composer.insertPass(bloomPass, 1);

	// setup scene
	three.scene.background = new THREE.Color(0xaa2020);
	three.camera.position.setScalar(20);
	three.camera.lookAt(new THREE.Vector3().setScalar(0));

	gameCtx.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000));
	gameCtx.add(ObjectFeaturability.new(THREE.Object3D));

	const cube = new THREE.Mesh(
		new THREE.BoxGeometry(),
		new THREE.MeshStandardMaterial({
			emissive: 0xffffff,
			emissiveIntensity: 4,
		})
	);
	cube.position.setX(4);
	gameCtx.add(cube);

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

	gameCtx.getRoot().addFeature(OrbitCameraGof, {
		options: {
			maxDistance: 50,
			initDistance: 40,
			enablePan: true,
		},
	});
	gameCtx.getRoot().addFeature(CannonPhysicsDebuggerGof);
	// gameWorld.create().addFeature(TestGof)
	const go = ObjectFeaturability.new(THREE.Object3D);
	go.userData.featurability.addFeature(TestGof);

	setTimeout(() => {
		go.removeFromParent()
		setTimeout(() => {
			gameCtx.add(go);
		}, 1000)
	}, 1000)

	gameCtx.add(go);
}
