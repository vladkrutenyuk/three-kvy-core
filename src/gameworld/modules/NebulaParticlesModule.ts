import GameWorld from '../GameWorld'
import GameWorldModule from '../GameWorldModule'
import * as NEBULA from 'three-nebula'
// import * as THREE from '../../../node_modules/three/build/three.module.js'
import * as THREE from 'three'

declare module 'three-nebula' {
	interface SpriteRenderer {
		// constructor(): void
	}
}

export default class NebulaParticlesModule extends GameWorldModule {
	system!: NEBULA.System
	spriteRenderer!: NEBULA.SpriteRenderer

	onInit<TModules extends Readonly<Record<string, GameWorldModule>>>(
		world: GameWorld<TModules>
	): void {
		this.system = new NEBULA.System()
		/**
		 * @requires THREE - { Mesh, BoxGeometry, MeshLambertMaterial }
		 */
		this.spriteRenderer = new NEBULA.SpriteRenderer(
			world.three.scene,
			//@ts-ignore
			{ Mesh: THREE.Mesh, BoxGeometry: THREE.BoxGeometry, MeshLambertMaterial: THREE.MeshLambertMaterial}
		)
		this.system.addRenderer(this.spriteRenderer)

		world.three.addEventListener('beforeRender', this.onBeforeRender)
		world.three.addEventListener('destroy', this.onDestroy)
	}

	onBeforeRender = () => {
		this.system.update()
	}

	onDestroy = () => {
		this.system.removeRenderer(this.spriteRenderer)
		this.system.destroy()
	}
}
