import * as THREE from 'three'

export default class InputSystem {
	private _domElement: HTMLElement
	
	readonly activePointers = new Map<number, PointerEvent>()
	private readonly _averageActivePointersCoords = { x: 0, y: 0 }
	private _pointerXStack = [0, 0]
	private _pointerYStack = [0, 0]
	private readonly _keys = new Set<string>()

	shiftKey: boolean = false
	altKey: boolean = false
	ctrlKey: boolean = false
	metaKey: boolean = false

	get pointerDeltaX() {
		return this._pointerXStack[1] - this._pointerXStack[0]
	}
	get pointerDeltaY() {
		return this._pointerYStack[1] - this._pointerYStack[0]
	}

	get isDragging() {
		return this._isDragging
	}
	private _isDragging = false

	public keys = (key: string) => {
		return this._keys.has(key)
	}

	private readonly _pointerNdc = new THREE.Vector2()

	/** Pointer position {x,y} in normalized device coordinates (-1 to +1) */
	get pointerNdc() {
		return this._pointerNdc
	}

	constructor(props: { domElement: HTMLElement }) {
		this._domElement = props.domElement

		this._domElement.addEventListener('focus', this.onFocus)
		this._domElement.addEventListener('blur', this.onBlur)

		this._domElement.addEventListener('pointerenter', this.onPointerEnter)
		this._domElement.addEventListener('pointerdown', this.onPointerDown)
		this._domElement.addEventListener('pointermove', this.onPointerMove)
		this._domElement.addEventListener('pointerup', this.onPointerUp)
		this._domElement.addEventListener('pointerleave', this.onPointerLeave)
		this._domElement.addEventListener('keydown', this.onKeyDown)
		this._domElement.addEventListener('keyup', this.onKeyUp)
	}

	private onFocus = () => {
		this.resetPointers()
	}
	private onBlur = () => {
		this.shiftKey = false
		this.altKey = false
		this.ctrlKey = false
		this.metaKey = false
		this._keys.clear()
		this.resetPointers()
	}

	private onPointerEnter = (event: globalThis.PointerEvent) => {}

	private onPointerDown = (event: globalThis.PointerEvent) => {
		this.activePointers.set(event.pointerId, event)
		this.updateStackAndNdcByActivePointers(true)
		this._isDragging = true
	}

	private onPointerMove = (event: globalThis.PointerEvent) => {
		if (this.activePointers.size > 0) {
			this.activePointers.has(event.pointerId) &&
				this.activePointers.set(event.pointerId, event)
			this.updateStackAndNdcByActivePointers()
		} else {
			this.updateStackAndNdcByPointer(event.clientX, event.clientY)
		}
	}

	private onPointerUp = (event: globalThis.PointerEvent) => {
		this.activePointers.delete(event.pointerId)
		this._isDragging = this.activePointers.size > 0
	}

	private onPointerLeave = () => {
		this.resetPointers()
	}

	private updateAverageActivePointersCoords() {
		let x = 0
		let y = 0
		const size = this.activePointers.size
		if (size === 1) {
			const pointerEvent = this.activePointers.values().next().value
			x = pointerEvent.clientX
			y = pointerEvent.clientY
		} else if (size > 1) {
			let sumX = 0
			let sumY = 0
			this.activePointers.forEach((pointer) => {
				sumX += pointer.clientX
				sumY += pointer.clientY
			})
			x = sumX / size
			y = sumY / size
		}
		this._averageActivePointersCoords.x = x
		this._averageActivePointersCoords.y = y
		return this._averageActivePointersCoords
	}
	private updateStackAndNdcByActivePointers = (fillStack?: boolean) => {
		const { x, y } = this.updateAverageActivePointersCoords()
		this.updateStackAndNdcByPointer(x, y, fillStack)
	}

	private updateStackAndNdcByPointer(x: number, y: number, fillStack?: boolean) {
		if (fillStack) {
			this.fillPointerStack(x, y)
		} else {
			this.pushPointerStack(x, y)
		}
		this.recalculatePointerNcd(x, y)
	}

	private pushPointerStack(x: number, y: number) {
		this._pointerXStack.shift()
		this._pointerXStack.push(x)
		this._pointerYStack.shift()
		this._pointerYStack.push(y)
	}

	private fillPointerStack(x: number, y: number) {
		this._pointerXStack = [x, x]
		this._pointerYStack = [y, y]
	}

	private recalculatePointerNcd(clientX: number, clientY: number) {
		this._pointerNdc.x = (clientX / window.innerWidth) * 2 - 1
		this._pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1
	}

	private onKeyDown = (event: globalThis.KeyboardEvent) => {
		this.shiftKey = event.shiftKey
		this.altKey = event.altKey
		this.ctrlKey = event.ctrlKey
		this.metaKey = event.metaKey
		this._keys.add(event.code)
	}

	private onKeyUp = (event: globalThis.KeyboardEvent) => {
		this.shiftKey = event.shiftKey
		this.altKey = event.altKey
		this.ctrlKey = event.ctrlKey
		this.metaKey = event.metaKey
		this._keys.delete(event.code)
	}

	private resetPointers() {
		this._pointerXStack = [0, 0]
		this._pointerYStack = [0, 0]
		this.activePointers.clear()
	}

	on<K extends keyof HTMLElementEventMap>(
		...args: Parameters<typeof this._domElement.addEventListener<K>>
	) {
		this._domElement.addEventListener(...args)
	}

	off<K extends keyof HTMLElementEventMap>(
		...args: Parameters<typeof this._domElement.removeEventListener<K>>
	) {
		this._domElement.removeEventListener(...args)
	}
}
