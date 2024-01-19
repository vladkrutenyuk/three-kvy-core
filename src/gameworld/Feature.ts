import * as THREE from 'three'
import GameObject from './GameObject'
import GameWorld, { GameWorldModulesRecord } from './GameWorld'

let _featureId = 0
export type FeatureProps<
	TModules extends GameWorldModulesRecord = {},
	TProps = unknown
> = TProps & {
	gameObject: GameObject<TModules>
}

export default abstract class Feature<
	TModules extends GameWorldModulesRecord = {},
	TEventMap extends {} = {},
	TProps = unknown
> extends THREE.EventDispatcher<TEventMap> {
	readonly type: string
	readonly id: number
	readonly gameObject: GameObject<TModules>
	uuid: string

	private _world: GameWorld<TModules> | null = null
	protected get world() {
		return this._world
	}

	constructor(props: FeatureProps<TModules, TProps>) {
		super()
		this.type = Feature.name
		this.gameObject = props.gameObject
		this.id = _featureId++
		this.uuid = THREE.MathUtils.generateUUID()

		this.gameObject.addEventListener('attachedToWorld', this.attachedToWorld)
		this.gameObject.addEventListener('detachedFromWorld', this.detachedFromWrold)
	}

	protected onAttach(world: GameWorld<TModules>): void {}
	protected onDetach(world: GameWorld<TModules>): void {}
	protected onBeforeRender = (world: GameWorld<TModules>): void => {}

	private attachedToWorld = (
		event: {
			world: GameWorld<TModules>
		} & THREE.Event<'attachedToWorld', GameObject<TModules>>
	) => {
		this._world = event.world
		this.onAttach(this._world)
	}
	private detachedFromWrold = (
		event: {
			world: GameWorld<TModules>
		} & THREE.Event<'detachedFromWorld', GameObject<TModules>>
	) => {
		this._world = null
		this.onDetach(event.world)
	}

	initOnBeforeRender = () => {
		let listener: (() => void) | null = null
		this.gameObject.addEventListener('attachedToWorld', (event) => {
			const { world } = event
			listener = () => this.onBeforeRender(world)
			world.three.addEventListener('beforeRender', listener)
		})
		this.gameObject.addEventListener('detachedFromWorld', (event) => {
			const { world } = event
			listener && world.three.removeEventListener('beforeRender', listener)
		})
	}
}
