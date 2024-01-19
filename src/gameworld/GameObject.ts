import * as THREE from 'three'
import GameWorld, { GameWorldModulesRecord } from './GameWorld'
import Feature, { FeatureProps } from './Feature'
import { removeArrayItem } from './utils/remove-array-item'

export type GameObjectEventMap<TModules extends GameWorldModulesRecord = {}> = {
	attachedToWorld: { world: GameWorld<TModules> }
	detachedFromWorld: { world: GameWorld<TModules> }
}
const _event: {
	[K in keyof GameObjectEventMap<any>]: { type: K } & Partial<
		GameObjectEventMap<any>[K]
	>
} = {
	attachedToWorld: { type: 'attachedToWorld' },
	detachedFromWorld: { type: 'detachedFromWorld' },
}
export default class GameObject<
	TModules extends GameWorldModulesRecord = {}
> extends THREE.Object3D<THREE.Object3DEventMap & GameObjectEventMap<TModules>> {
	public readonly isGameObject = true

	protected _world: GameWorld<TModules> | null = null
	get world() {
		return this._world
	}

	constructor() {
		super()
		this.addEventListener('added', this.onAdded)
		this.addEventListener('removed', this.onRemoved)
	}

	private onAdded = ({ target }: THREE.Event<'added', this>) => {
		if (target.parent && GameObject.isIt<TModules>(target.parent)) {
			target.parent._world && target.attachToWorldRecursively(target.parent._world)
			return
		}
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы GameObject
		let gameObjectAncestor: GameObject<TModules> | null = null
		target.traverseAncestorsInterruptible((ancestor: THREE.Object3D) => {
			const isGameObject = GameObject.isIt<TModules>(ancestor)
			if (isGameObject) {
				gameObjectAncestor = ancestor
			}
			return !isGameObject
		})
		gameObjectAncestor = gameObjectAncestor as GameObject<TModules> | null

		// если нашли и если у него есть мир то аттачимся к нему
		if (gameObjectAncestor !== null) {
			gameObjectAncestor._world && target.attachToWorldRecursively(gameObjectAncestor._world)
		}
		// иначе отменяем добавление и высвечиваем ошибку
		else {
			console.error(
				`It's prohibited to add GameObject to simple Object3D which is not in any GameWorld.`,
				`Add that Object3D to GameWorld or GameObject beforehand.`,
				`Or just add this GameObject to another GameObject.`
			)
			this.removeFromParent()
		}
	}

	private onRemoved = (_: THREE.Event<'removed', this>) => {
		this.detachFromWorldRecursively()
	}

	private attachToWorld(world: GameWorld<TModules>) {
		if (this._world !== null) {
			if (this._world !== world) {
				this.detachFromWorld()
				this.attachToWorld(world)
			}
			return
		}

		this._world = world
		_event.attachedToWorld.world = this._world
		this.dispatchEvent(
			_event.attachedToWorld as Required<typeof _event.attachedToWorld>
		)
	}

	private detachFromWorld() {
		if (this._world === null) return

		_event.detachedFromWorld.world = this._world
		this._world = null
		this.dispatchEvent(
			_event.detachedFromWorld as Required<typeof _event.detachedFromWorld>
		)
	}

	private attachToWorldRecursively(world: GameWorld<TModules>) {
		this.attachToWorld(world)
		this.traverse((child) => {
			GameObject.isIt<TModules>(child) && child.attachToWorld(world)
		})
	}

	private detachFromWorldRecursively() {
		this.detachFromWorld()
		this.traverse((child) => {
			GameObject.isIt(child) && child.detachFromWorld()
		})
	}

	add(...object: THREE.Object3D<THREE.Object3DEventMap>[]): this {
		// TODO write types to prevent adding GameObjects with diffirent defined GameWorldModules
		super.add(...object)
		return this
	}

	private readonly _features: Feature<TModules>[] = []

	addFeature<TFeature extends Feature<TModules, TEventMap, TProps>, TEventMap extends {}, TProps>(
		f: new (p: FeatureProps<TModules, TProps>) => TFeature,
		props: TProps
	): TFeature
	addFeature<TFeature extends Feature<TModules, TEventMap, void>, TEventMap extends {}>(
		f: new (p: FeatureProps<TModules, void>) => TFeature,
		props?: void
	): TFeature
	addFeature<TFeature extends Feature<TModules, TEventMap, unknown>, TEventMap extends {}>(
		f: new (p: FeatureProps<TModules>) => TFeature,
		props: unknown
	): TFeature {
		const feature = new f(
			props !== undefined ? { gameObject: this, ...props } : { gameObject: this }
		)
		this._features.push(feature)
		return feature
	}

	public getFeature<TFeatureType extends typeof Feature>(
		f: TFeatureType
	): InstanceType<TFeatureType> | null {
		return this._features.find(
			(feature) => feature.type === f.name
		) as InstanceType<TFeatureType> | null
	}

	public removeFeature<TFeature extends Feature<TModules>>(feature: TFeature) {
		removeArrayItem(this._features, feature)
		//TODO remvoe feature
	}

	static isIt<TModules extends GameWorldModulesRecord = {}>(
		obj: THREE.Object3D
	): obj is GameObject<TModules> {
		return (obj as GameObject<TModules>).isGameObject
	}
}
