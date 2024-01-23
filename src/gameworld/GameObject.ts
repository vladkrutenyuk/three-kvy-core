import * as THREE from 'three'
import GameWorld, { GameWorldModulesRecord } from './GameWorld'
import Feature, { FeatureProps } from './Feature'
import { removeArrayItem } from './utils/remove-array-item'
import { traverseAncestorsInterruptible } from './utils/traverse-interruptible'
import { isScene } from './utils/types/is-scene'

export type GameObjectEventMap<TModules extends GameWorldModulesRecord = {}> = {
	attachedToWorld: { world: GameWorld<TModules> }
	detachedFromWorld: { world: GameWorld<TModules> }
}

export default class GameObject<
	TModules extends GameWorldModulesRecord = {}
> extends THREE.Object3D<THREE.Object3DEventMap & GameObjectEventMap<TModules>> {
	public readonly isGameObject = true

	protected _world: GameWorld<TModules> | null = null
	get world() {
		return this._world
	}

	private readonly _features: Feature<TModules>[] = []

	constructor(props?: { uuid?: string, name?: string}) {
		super()
		this.addEventListener('added', this.onAdded)
		this.addEventListener('removed', this.onRemoved)
		this.name = props?.name ?? `${this.constructor.name}-${this.id}`
		this.uuid = props?.uuid ?? this.uuid
	}

	protected onAdded = ({ target }: THREE.Event<'added', this>) => {
		this._log('onAdded...')
		if (target.parent && GameObject.isIt<TModules>(target.parent)) {
			this._log('onAdded parent is gameobject')
			target.parent._world && target.attachToWorldRecursively(target.parent._world)
			return
		}
		this._log('onAdded parent is just object3d')
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы GameObject
		let gameObjectAncestor: GameObject<TModules> | null = null
		traverseAncestorsInterruptible(target, (ancestor: THREE.Object3D) => {
			const isGameObject = GameObject.isIt<TModules>(ancestor)
			if (isGameObject) {
				gameObjectAncestor = ancestor
			}
			return !isGameObject
		})
		gameObjectAncestor = gameObjectAncestor as GameObject<TModules> | null

		// если нашли и если у него есть мир то аттачимся к нему
		if (gameObjectAncestor !== null) {
			this._log('onAdded found game object ancestor')
			gameObjectAncestor._world &&
				target.attachToWorldRecursively(gameObjectAncestor._world)
		}
		// иначе отменяем добавление и высвечиваем ошибку
		else {
			// если у gameobject есть мир и был доавблен к сцене у которой есть gameWorldId ранвый этому миру
			// то этот gameobject это gameworld который был добавлен в сцену на ините
			if (
				target._world &&
				target.parent &&
				isScene(target.parent) &&
				target.parent.userData.gameWorldId === target._world.id
			) {
				this._log('onAdded it is gameworld added to scene')
				return
			}
			// иначе светим ошибку и отменяем добавление
			console.error(
				`It's prohibited to add GameObject to simple Object3D which is not in any GameWorld.`,
				`Add that Object3D to GameWorld or GameObject beforehand.`,
				`Or just add this GameObject to another GameObject.`
			)
			this.removeFromParent()
		}
	}

	private onRemoved = (_: THREE.Event<'removed', this>) => {
		this._log('onRemoved...')
		this.detachFromWorldRecursively()
	}

	private attachToWorld(world: GameWorld<TModules>) {
		this._log('attachToWorld...')
		if (this._world !== null) {
			this._log('attachToWorld: has world')
			if (this._world !== world) {
				this._log('attachToWorld: has different world')
				this.detachFromWorld()
				this.attachToWorld(world)
			}
			return
		}

		this._world = world
		_event.attachedToWorld.world = this._world
		this._log('attachToWorld done!')
		this.dispatchEvent(
			_event.attachedToWorld as Required<typeof _event.attachedToWorld>
		)
	}

	private detachFromWorld() {
		this._log('detachFromWorld...')
		if (this._world === null) return

		_event.detachedFromWorld.world = this._world
		this._world = null
		this._log('detachFromWorld done!')
		this.dispatchEvent(
			_event.detachedFromWorld as Required<typeof _event.detachedFromWorld>
		)
	}

	private attachToWorldRecursively(world: GameWorld<TModules>) {
		this._log('attachToWorldRecursively...')
		// this.attachToWorld(world)
		this.traverse((child) => {
			GameObject.isIt<TModules>(child) && child.attachToWorld(world)
		})
	}

	private detachFromWorldRecursively() {
		this._log('detachFromWorldRecursively...')
		// this.detachFromWorld()
		this.traverse((child) => {
			GameObject.isIt(child) && child.detachFromWorld()
		})
	}

	add(...object: THREE.Object3D<THREE.Object3DEventMap>[]): this {
		// TODO write types to prevent adding GameObjects with diffirent defined GameWorldModules
		this._log(`add... ${object[0].id}`)
		super.add(...object)
		return this
	}

	addFeature<
		TFeature extends Feature<TModules, TEventMap, TProps>,
		TEventMap extends {},
		TProps extends Readonly<Record<string, any>> = {}
	>(f: new (p: FeatureProps<TModules, TProps>) => TFeature, props: TProps): TFeature

	addFeature<TFeature extends Feature<TModules, TEventMap, {}>, TEventMap extends {}>(
		f: new (p: FeatureProps<TModules, {}>) => TFeature,
		props?: {}
	): TFeature

	addFeature<TFeature extends Feature<TModules, TEventMap, {}>, TEventMap extends {}>(
		f: new (p: FeatureProps<TModules>) => TFeature,
		props: unknown
	): TFeature {
		this._log(`addFeature...`, f.name)
		const feature = new f(
			props !== undefined ? { gameObject: this, ...props } : { gameObject: this }
		)
		this._features.push(feature)
		feature.init()
		return feature
	}

	getFeature<TFeatureType extends typeof Feature>(
		f: TFeatureType
	): InstanceType<TFeatureType> | null {
		return this._features.find(
			(feature) => feature.type === f.name
		) as InstanceType<TFeatureType> | null
	}

	destroyFeature<TFeature extends Feature<TModules>>(feature: TFeature) {
		this._log(`destroyFeature...`, feature.constructor.name, feature.id)
		const foundAndRemoved = removeArrayItem(this._features, feature)
		if (foundAndRemoved) {
			feature.destroy()
		}
	}

	private _log = (...args: any[]) => {
		console.log(`g-${this.id}`, ...args)
	}

	static isIt<TModules extends GameWorldModulesRecord = {}>(
		obj: THREE.Object3D
	): obj is GameObject<TModules> {
		return (obj as GameObject<TModules>).isGameObject
	}
}

const _event: {
	[K in keyof GameObjectEventMap<any>]: { type: K } & Partial<
		GameObjectEventMap<any>[K]
	>
} = {
	attachedToWorld: { type: 'attachedToWorld' },
	detachedFromWorld: { type: 'detachedFromWorld' },
}
