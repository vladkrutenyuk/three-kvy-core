import GameObjectFeature, {
	GameObjectFeatureBaseProps,
} from '@/core/GameEngine/entities/GameObjectFeature'
import * as THREE from 'three'
//! important to import only types from 'nipplejs' bcs it brokes for nextjs ssr:
//! it requests "window" on init, but its undefined
import type { EventData, JoystickManager, JoystickOutputData } from 'nipplejs'

export type MovementInputMode = 'keyboard' | 'joystick'
export enum MovemenInputDirectionType {
	None,
	Forward,
	Backward,
	Right,
	Left,
}

export default class MovementInputGof extends GameObjectFeature<
	unknown,
	{
		directionTypeChanged: { directionType: MovemenInputDirectionType }
		changed: { vector: THREE.Vector3 }
	}
> {
	readonly type = MovementInputGof.name

	private _vector = new THREE.Vector3()

	/** @description 'x' is left/right movement, 'z' is forward/back movement */
	public get vector() {
		return this._vector
	}

	private _isSpeedUp = false
	public get isSpeedUp() {
		return this._isSpeedUp
	}
	private _nipplsJsImport?: typeof import('nipplejs')
	private _joystickManager: JoystickManager | null = null

	public useKeyboard = true

	constructor(props: GameObjectFeatureBaseProps) {
		super(props)
	}
    
	protected onUpdate(): void {
		if (!this.useKeyboard) return

		const { keys, shiftKey } = this.ctx.input
		const forward = keys('KeyW') || keys('ArrowUp') ? 1 : 0
		const left = keys('KeyA') || keys('ArrowLeft') ? 1 : 0
		const back = keys('KeyS') || keys('ArrowDown') ? -1 : 0
		const right = keys('KeyD') || keys('ArrowRight') ? -1 : 0
		this.setVector(right + left, forward + back)
		this._isSpeedUp = shiftKey
	}

	public setVector(x: number, z: number) {
		const _x = this._vector.x
		const _z = this._vector.z
		this._vector.set(x, 0, z).normalize()
		if (_x !== x || _z !== z) {
			this.dispatchEvent({ type: 'changed', vector: this.vector })
			this.checkIfDirectionTypeChanged()
		}
	}

	public reset() {
		this._directionType = MovemenInputDirectionType.None
		this._vector = new THREE.Vector3(0, 0, 0)
	}
}
