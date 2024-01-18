import * as THREE from 'three'
import GameWorld, { GameWorldModulesRecord } from './GameWorld'

export default class GameObject<
	TWorldModules extends GameWorldModulesRecord = {}
> extends THREE.Object3D {
	public readonly isGameObject = true

	protected _world: GameWorld<TWorldModules> | null = null

	constructor() {
		super()
		this.addEventListener('added', (event) => {
			const { target } = event
			if (target._world !== null) return
			if (target.parent && GameObject.isIt(target.parent)) return
			// обрабатываем случай когда GameObject был добавлен к обычному Object3D

			// ищем предка который был бы GameObject
			let ancestor: GameObject<TWorldModules> | null = null
			target.traverseAncestorsInterruptible((ancestor: THREE.Object3D) => {
				const isGameObject = GameObject.isIt<TWorldModules>(ancestor)
				if (isGameObject) {
					ancestor = ancestor
				}
				return !isGameObject
			})
			ancestor = ancestor as GameObject<TWorldModules> | null

			// если нашли и если у него мир то аттачимся к нему
			if (ancestor !== null) {
				ancestor._world && target.attachToWorld(ancestor._world)
			}
			// иначе отменяем добавление и высвечиваем ошибку
			else {
				console.error(
					`It's prohibited to add GameObject to simple Object3D which is not in any GameWorld.`,
					`Add that Object3D to GameWorld or some GameObject beforehand.`,
					`Or just add to another GameObject.`
				)
				this.removeFromParent()
			}
		})
	}

	addFeature() {}

	private attachToWorld(world: GameWorld<TWorldModules>) {
		if (this._world === null) {
			this._world = world
			//TODO траверсом заатачить всех геймобжектов детей
			return
		}
		if (this._world !== world) {
			console.warn(
				`Can not be attached to world because it had already been attached.`,
				'Use method `detachFromWorld()` before.'
			)
		}
	}

	private detachFromWorld() {
		if (this._world === null) return

		if (this.parent) {
			this.removeFromParent()
		}
		this._world = null
		//TODO траверсом детачить от мира всех остальных детей но не удалить их из родителя
	}

	add(...object: THREE.Object3D<THREE.Object3DEventMap>[]): this {
		if (this._world !== null) {
			for (let i = 0; i < object.length; i++) {
				const obj = object[i]
				if (GameObject.isIt(obj)) {
					if (obj._world === null) {
						obj.attachToWorld(this._world)
					} else if (obj._world !== this._world) {
						//? может быть автоматически менять мир геймобъекта без ошибки
						console.error(
							`It's prohibited to add one world's game object to another world's game object`
						)
						continue
					}
				}
				super.add(obj)
			}
		}
		return this
	}

	remove(...object: THREE.Object3D<THREE.Object3DEventMap>[]): this {
		super.remove(...object)
		if (this._world !== null) {
			for (let i = 0; i < object.length; i++) {
				const obj = object[i]
				if (GameObject.isIt(obj)) {
					obj.detachFromWorld()
				}
			}
		}
		return this
	}

	removeFromParent(): this {
		super.removeFromParent()
		this.detachFromWorld()
		return this
	}

	static isIt<TModules extends GameWorldModulesRecord = {}>(
		obj: THREE.Object3D
	): obj is GameObject<TModules> {
		return (obj as GameObject<TModules>).isGameObject
	}
}
