import * as THREE from "three"
import GameObject from "./GameObject"
import GameWorld, { GameWorldModulesRecord } from "./GameWorld"

let _featureId = 0

export type FeatureProps<
	TModules extends GameWorldModulesRecord = {},
	TProps extends {} = {}
> = TProps & {
	gameObject: GameObject<TModules>
}

export type FeatureEventMap<TModules extends GameWorldModulesRecord = {}> = {
	attachedToWorld: { world: GameWorld<TModules> }
	detachedFromWorld: { world: GameWorld<TModules> }
	destroy: {}
}

export default abstract class Feature<
	TModules extends GameWorldModulesRecord = {},
	TEventMap extends {} = {},
	TProps extends Record<string, any> = {}
> extends THREE.EventDispatcher<FeatureEventMap<TModules> & TEventMap> {
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
		this.type = this.constructor.name
		this.gameObject = props.gameObject
		this.id = _featureId++
		this.uuid = THREE.MathUtils.generateUUID()

		this.addEventListener("attachedToWorld", ({ world }) => {
			this.onAttach(world)
		})
		this.addEventListener("detachedFromWorld", ({ world }) => {
			this.onDetach(world)
		})
		this.addEventListener("destroy", () => {
			this.onDestroy()
		})

		this.gameObject.addEventListener(
			"attachedToWorld",
			this.gameObjectAttachedToWorld
		)
		this.gameObject.addEventListener(
			"detachedFromWorld",
			this.gameObjectDetachedFromWorld
		)
	}

	init() {
		this.gameObject.world && this.attachToWorld(this.gameObject.world)
	}

	destroy() {
		this._log("remove...")
		this.gameObject.removeEventListener(
			"attachedToWorld",
			this.gameObjectAttachedToWorld
		)
		this.gameObject.removeEventListener(
			"detachedFromWorld",
			this.gameObjectDetachedFromWorld
		)
		this.detachFromWorld()
		this.gameObject.destroyFeature(this)

		//TODO fix type error
		//@ts-ignore
		this.dispatchEvent(_event.destroy)
	}

	protected onAttach(_: GameWorld<TModules>) {}
	protected onDetach(_: GameWorld<TModules>) {}
	protected onDestroy() {}

	private gameObjectAttachedToWorld = (event: { world: GameWorld<TModules> }) => {
		this._log("gameObjectAttachedToWorld")
		this.attachToWorld(event.world)
	}
	private gameObjectDetachedFromWorld = (_: { world: GameWorld<TModules> }) => {
		this._log("gameObjectDetachedFromWorld")
		this.detachFromWorld()
	}

	private attachToWorld = (world: GameWorld<TModules>) => {
		this._log("attachToWorld...")
		if (this._world) {
			if (this.world === world) return
			this._log("attachToWorld has world")
			this.detachFromWorld()
		}
		this._world = world

		_event.attachedToWorld.world = this._world
		this._log("attachToWorld done!")
		this.dispatchEvent(
			//TODO fix type error
			//@ts-ignore
			_event.attachedToWorld
		)
	}

	private detachFromWorld = () => {
		this._log("detachFromWorld...")
		if (!this._world) return
		const world = this._world
		this._world = null

		_event.detachedFromWorld.world = world
		this._log("detachFromWorld done!")
		//TODO fix type error
		//@ts-ignore
		this.dispatchEvent(_event.detachedFromWorld)
	}

	private _eventMethodsDict = {
		onBeforeRender: "beforeRender",
		onAfterRender: "afterRender",
		onUnmount: "unmount",
		onMount: "mount",
		onResize: "resize",
	} as const

	protected initEventMethod(name: keyof typeof this._eventMethodsDict) {
		let listener: (() => void) | null = null

		const init = (world: GameWorld<TModules>) => {
			let listener = () => {
				this[name](world)
			}
			world.three.addEventListener(this._eventMethodsDict[name], listener)
		}

		this.addEventListener("attachedToWorld", (event) => {
			init(event.world)
		})
		this.addEventListener("detachedFromWorld", (event) => {
			listener && event.world.three.removeEventListener("beforeRender", listener)
		})

		this._world && init(this._world)
	}
	protected onBeforeRender(_: GameWorld<TModules>) {}
	protected onAfterRender(_: GameWorld<TModules>) {}
	protected onUnmount(_: GameWorld<TModules>) {}
	protected onMount(_: GameWorld<TModules>) {}
	protected onResize(_: GameWorld<TModules>) {}

	private _log(...args: any[]) {
		console.log(
			`GO-${this.gameObject.id} ${this.constructor.name}-${this.id}`,
			...args
		)
	}
}

const _event: {
	[K in keyof FeatureEventMap<any>]: { type: K } & FeatureEventMap<any>[K]
} = {
	attachedToWorld: { type: "attachedToWorld", world: {} as any },
	detachedFromWorld: { type: "detachedFromWorld", world: {} as any },
	destroy: { type: "destroy" },
}
