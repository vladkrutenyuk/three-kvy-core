import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import GameWorld from './gameworld/GameWorld'
import CannonPhysicsModule from './gameworld/modules/CannonPhysicsModule'
import NebulaParticlesModule from './gameworld/modules/NebulaParticlesModule'
import ThreePostProcessingModule from './gameworld/modules/ThreePostProcessingModule'
import './style.css'

console.log('main.ts')

createWorld()
function createWorld() {
	const root = document.querySelector('#app')
	if (!root) return

	const gameWorld = new GameWorld({
		modules: {
			cannon: new CannonPhysicsModule(),
			// nebula: new NebulaParticlesModule(),
			postprocessing: new ThreePostProcessingModule(),
		} as const,
		three: {
			rendererParams: {
				antialias: true,
				logarithmicDepthBuffer: true,
				preserveDrawingBuffer: true,
			},
		},
	})
	const { three, animationFrameLoop, modules } = gameWorld
	const { postprocessing, cannon } = modules

	// setup postprocessing
	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2().setScalar(1),
		0.24,
		0.2,
		1.38
	)
	three.addEventListener('resize', (event) => {
		const { width, height } = event
		bloomPass.resolution.set(width * 0.5, height * 0.5)
	})
	postprocessing.composer.insertPass(bloomPass, 1)

	// setup scene
	three.scene.background = new THREE.Color(0xff0000)
	three.camera.position.setScalar(20)
	three.camera.lookAt(new THREE.Vector3().setScalar(0))
	three.scene.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000))

	const cube = new THREE.Mesh(
		new THREE.BoxGeometry(),
		new THREE.MeshStandardMaterial({
			emissive: 0xffffff,
			emissiveIntensity: 4,
		})
	)
	three.scene.add(cube)

	// start
	three.mount(root as HTMLDivElement)
	animationFrameLoop.run()
}
