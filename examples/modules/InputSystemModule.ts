import { GameWorld, GameWorldModule, GameWorldModulesRecord } from "@vladkrutenyuk/game-world";
import * as THREE from "three";

export class InputSystemModule extends GameWorldModule {
	private _dom!: HTMLElement;

	private readonly _keys = new Set<string>();

	private _shiftKey: boolean = false;
	private _altKey: boolean = false;
	private _ctrlKey: boolean = false;
	private _metaKey: boolean = false;

	private _isDragging = false;
	private readonly _pointerNdc = new THREE.Vector2();
	private readonly _averageActivePointersCoords = { x: 0, y: 0 };

	//TODO _pointerXStack: rewrite to readonly obj
	private _pointerXStack = [0, 0];
	//TODO _pointerYStack: rewrite to readonly obj
	private _pointerYStack = [0, 0];
	private _domBoundingClientRect: DOMRect | null = null;

	public readonly activePointers = new Map<number, PointerEvent>();

	public get pointerDeltaX() {
		return this._pointerXStack[1] - this._pointerXStack[0];
	}
	public get pointerDeltaY() {
		return this._pointerYStack[1] - this._pointerYStack[0];
	}

	public get isDragging() {
		return this._isDragging;
	}

	/** Pointer position {x,y} in normalized device coordinates (-1 to +1) */
	public get pointerNdc() {
		return this._pointerNdc;
	}

	public get shiftKey() {
		return this._shiftKey;
	}
	public get altKey() {
		return this._altKey;
	}
	public get ctrlKey() {
		return this._ctrlKey;
	}
	public get metaKey() {
		return this._metaKey;
	}

	public isKeyDown = (key: string) => {
		return this._keys.has(key);
	};

	protected onInit<TModules extends GameWorldModulesRecord>(
		world: GameWorld<TModules>
	): void {
		this._dom = world.three.renderer.domElement;

		window.addEventListener("resize", this.onWindowResize);
		window.addEventListener("scroll", this.onWindowScroll);
		world.three.addEventListener("resize", this.onDomResize);
		this._dom.addEventListener("focus", this.onFocus);
		this._dom.addEventListener("blur", this.onBlur);
		this._dom.addEventListener("pointerenter", this.onPointerEnter);
		this._dom.addEventListener("pointerdown", this.onPointerDown);
		this._dom.addEventListener("pointermove", this.onPointerMove);
		this._dom.addEventListener("pointerup", this.onPointerUp);
		this._dom.addEventListener("pointerleave", this.onPointerLeave);
		this._dom.addEventListener("keydown", this.onKeyDown);
		this._dom.addEventListener("keyup", this.onKeyUp);
	}

	protected onDestroy<
		TModules extends Readonly<Record<string, GameWorldModule>>
	>(event: { world: GameWorld<TModules> }): void {
		window.removeEventListener("resize", this.onWindowResize);
		window.removeEventListener("scroll", this.onWindowScroll);
		event.world.three.removeEventListener("resize", this.onDomResize);
		this._dom.removeEventListener("focus", this.onFocus);
		this._dom.removeEventListener("blur", this.onBlur);
		this._dom.removeEventListener("pointerenter", this.onPointerEnter);
		this._dom.removeEventListener("pointerdown", this.onPointerDown);
		this._dom.removeEventListener("pointermove", this.onPointerMove);
		this._dom.removeEventListener("pointerup", this.onPointerUp);
		this._dom.removeEventListener("pointerleave", this.onPointerLeave);
		this._dom.removeEventListener("keydown", this.onKeyDown);
		this._dom.removeEventListener("keyup", this.onKeyUp);
	}

	private onWindowResize = () => {
		this.updateDomBoundingClientRect();
	};

	private onWindowScroll = () => {
		this.updateDomBoundingClientRect();
	};

	private onDomResize = () => {
		this.updateDomBoundingClientRect();
	};

	private onFocus = () => {
		this.resetKeys();
		this.resetPointers();
	};
	private onBlur = () => {
		this.resetKeys();
		this.resetPointers();
	};

	private onKeyDown = (event: globalThis.KeyboardEvent) => {
		this.updFnKeys(event);
		this._keys.add(event.code);
	};

	private onKeyUp = (event: globalThis.KeyboardEvent) => {
		this.updFnKeys(event);
		this._keys.delete(event.code);
	};

	private onPointerEnter = (_: globalThis.PointerEvent) => {};

	private onPointerDown = (event: globalThis.PointerEvent) => {
		this.activePointers.set(event.pointerId, event);
		this.updateStackAndNdcByActivePointers(true);
		this._isDragging = true;
	};

	private onPointerMove = (event: globalThis.PointerEvent) => {
		if (this.activePointers.size > 0) {
			this.activePointers.has(event.pointerId) &&
				this.activePointers.set(event.pointerId, event);
			this.updateStackAndNdcByActivePointers();
		} else {
			this.updateStackAndNdcByPointer(event.clientX, event.clientY);
		}
	};

	private onPointerUp = (event: globalThis.PointerEvent) => {
		this.activePointers.delete(event.pointerId);
		this._isDragging = this.activePointers.size > 0;
	};

	private onPointerLeave = () => {
		this.resetKeys();
		this.resetPointers();
	};

	// KEYS

	private resetKeys() {
		this._shiftKey = false;
		this._altKey = false;
		this._ctrlKey = false;
		this._metaKey = false;
		this._keys.clear();
	}

	private updFnKeys(event: globalThis.KeyboardEvent) {
		this._shiftKey = event.shiftKey;
		this._altKey = event.altKey;
		this._ctrlKey = event.ctrlKey;
		this._metaKey = event.metaKey;
	}

	// POINTERS

	private updateAverageActivePointersCoords() {
		let x = 0;
		let y = 0;
		const size = this.activePointers.size;
		if (size === 1) {
			const pointerEvent = this.activePointers.values().next().value;
			x = pointerEvent.clientX;
			y = pointerEvent.clientY;
		} else if (size > 1) {
			let sumX = 0;
			let sumY = 0;
			this.activePointers.forEach((pointer) => {
				sumX += pointer.clientX;
				sumY += pointer.clientY;
			});
			x = sumX / size;
			y = sumY / size;
		}
		this._averageActivePointersCoords.x = x;
		this._averageActivePointersCoords.y = y;
		return this._averageActivePointersCoords;
	}
	private updateStackAndNdcByActivePointers = (fillStack?: boolean) => {
		const { x, y } = this.updateAverageActivePointersCoords();
		this.updateStackAndNdcByPointer(x, y, fillStack);
	};

	private updateStackAndNdcByPointer(x: number, y: number, fillStack?: boolean) {
		if (fillStack) {
			this.fillPointerStack(x, y);
		} else {
			this.pushPointerStack(x, y);
		}
		this.recalculatePointerNdc(x, y);
	}

	private pushPointerStack(x: number, y: number) {
		this._pointerXStack.shift();
		this._pointerXStack.push(x);
		this._pointerYStack.shift();
		this._pointerYStack.push(y);
	}

	private fillPointerStack(x: number, y: number) {
		this._pointerXStack = [x, x];
		this._pointerYStack = [y, y];
	}

	private resetPointers() {
		this._pointerXStack = [0, 0];
		this._pointerYStack = [0, 0];
		this.activePointers.clear();
	}

	// POINTER NDC

	private recalculatePointerNdc(clientX: number, clientY: number) {
		// this._dom.top
		this._pointerNdc.x = (clientX / this._dom.clientWidth) * 2 - 1;
		this._pointerNdc.y = -(clientY / this._dom.clientHeight) * 2 + 1;

		const bounds = this._domBoundingClientRect ?? this.updateDomBoundingClientRect();

		// Получаем координаты относительно контейнера
		const fixedClientX = (clientX - bounds.left) / bounds.width;
		const fixedClientY = (clientY - bounds.top) / bounds.height;

		// Преобразуем координаты в NDC
		this._pointerNdc.x = fixedClientX * 2 - 1;
		this._pointerNdc.y = -(fixedClientY * 2 - 1);
	}

	private updateDomBoundingClientRect() {
		this._domBoundingClientRect = this._dom.getBoundingClientRect();
		return this._domBoundingClientRect;
	}

	// CUSTOM EVENTS

	// public addRendererDomEventListener<K extends keyof HTMLElementEventMap>(
	// 	...args: Parameters<typeof this._dom.addEventListener<K>>
	// ) {
	// 	this._dom.addEventListener(...args);
	// }

	// public removeRendererDomEventListener<K extends keyof HTMLElementEventMap>(
	// 	...args: Parameters<typeof this._dom.removeEventListener<K>>
	// ) {
	// 	this._dom.removeEventListener(...args);
	// }
}
