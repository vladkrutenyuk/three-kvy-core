import * as THREE from "three";
import KVY from "../lib.js";

export class InputSystem extends KVY.CoreContextModule {

	/** @type { Map<number, PointerEvent>} */
	readonly pointers = new Map();

	shiftKey = false;
	altKey = false;
	ctrlKey = false;
	metaKey = false;

	get pointerDeltaX() {
		return this._pointerXStack[1] - this._pointerXStack[0];
	}
	get pointerDeltaY() {
		return this._pointerYStack[1] - this._pointerYStack[0];
	}

	get isDragging() {
		return this._isDragging;
	}
	/** Pointer position {x,y} in normalized device coordinates (-1 to +1) */
	get pointerNdc() {
		return this._pointerNdc;
	}
	keys = (key: string) => {
		return this._keys.has(key);
	};

	private _isDragging = false;
	private readonly _pointerNdc = new THREE.Vector2();
	private readonly _pointersCentroid = { x: 0, y: 0 };
	private _pointerXStack = [0, 0];
	private _pointerYStack = [0, 0];
	/** @type { Set<string>} */
	private readonly _keys = new Set();

	/** @param {KVY.CoreContext} ctx */
	useCtx(ctx) {
		const dom = ctx.three.renderer.domElement;

		const on = dom.addEventListener.bind(dom);
		const off = dom.removeEventListener.bind(dom);
		on("focus", this.onFocus);
		on("blur", this.onBlur);
		on("pointerdown", this.onPointerDown);
		on("pointermove", this.onPointerMove);
		on("pointerup", this.onPointerUp);
		on("pointerleave", this.onPointerLeave);
		on("keydown", this.onKeyDown);
		on("keyup", this.onKeyUp);

		return () => {
			off("focus", this.onFocus);
			off("blur", this.onBlur);
			off("pointerdown", this.onPointerDown);
			off("pointermove", this.onPointerMove);
			off("pointerup", this.onPointerUp);
			off("pointerleave", this.onPointerLeave);
			off("keydown", this.onKeyDown);
			off("keyup", this.onKeyUp);
		};
	}

	onResize = () => {

	}

	onFocus = () => {
		this.resetPointers();
	};
	onBlur = () => {
		this.updFnKeys(null);
		this._keys.clear();
		this.resetPointers();
	};

	onPointerDown = (event: globalThis.PointerEvent) => {
		this.pointers.set(event.pointerId, event);
		this.updateStackAndNdcByActivePointers(true);
		this._isDragging = true;
	};

	onPointerUp = (event: globalThis.PointerEvent) => {
		this.pointers.delete(event.pointerId);
		this._isDragging = this.pointers.size > 0;
	};

	onPointerMove = (event: globalThis.PointerEvent) => {
		if (this.pointers.size > 0) {
			this.pointers.has(event.pointerId) &&
				this.pointers.set(event.pointerId, event);
			this.updateStackAndNdcByActivePointers();
		} else {
			this.updateStackAndNdcByPointer(event.clientX, event.clientY);
		}
	};

	onPointerLeave = () => {
		this.resetPointers();
	};

	updatePointersCentroid() {
		let x = 0;
		let y = 0;
		const size = this.pointers.size;
		if (size === 1) {
			const pointerEvent = this.pointers.values().next().value;
			x = pointerEvent.clientX;
			y = pointerEvent.clientY;
		} else if (size > 1) {
			let sumX = 0;
			let sumY = 0;
			this.pointers.forEach((pointer) => {
				sumX += pointer.clientX;
				sumY += pointer.clientY;
			});
			x = sumX / size;
			y = sumY / size;
		}
		this._pointersCentroid.x = x;
		this._pointersCentroid.y = y;
		return this._pointersCentroid;
	}
	updateStackAndNdcByActivePointers = (fillStack?: boolean) => {
		const { x, y } = this.updatePointersCentroid();
		this.updateStackAndNdcByPointer(x, y, fillStack);
	};

	updateStackAndNdcByPointer(x: number, y: number, fillStack?: boolean) {
		if (fillStack) {
			this.fillPointerStack(x, y);
		} else {
			this.pushPointerStack(x, y);
		}
		this.calcPointerNcd(x, y);
	}


	calcPointerNcd(clientX: number, clientY: number) {
		//TODO make calcs relatively canvas, not window
		this._pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
		this._pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
	}

	pushPointerStack(x: number, y: number) {
		this._pointerXStack.shift();
		this._pointerXStack.push(x);
		this._pointerYStack.shift();
		this._pointerYStack.push(y);
	}

	fillPointerStack(x: number, y: number) {
		this._pointerXStack = [x, x];
		this._pointerYStack = [y, y];
	}

	resetPointers() {
		this._pointerXStack = [0, 0];
		this._pointerYStack = [0, 0];
		this.pointers.clear();
	}


	/** @param {globalThis.KeyboardEvent} event */
	onKeyDown = (event) => {
		this.updFnKeys(event);
		this._keys.add(event.code);
	};

	/** @param {globalThis.KeyboardEvent} event */
	onKeyUp = (event) => {
		this.updFnKeys(event);
		this._keys.delete(event.code);
	};

	/** @param {globalThis.KeyboardEvent|null} event */
	updFnKeys = (event) => {
		this.shiftKey = event?.shiftKey || false;
		this.altKey = event?.altKey || false;
		this.ctrlKey = event?.ctrlKey || false;
		this.metaKey = event?.metaKey || false;
	};
}
