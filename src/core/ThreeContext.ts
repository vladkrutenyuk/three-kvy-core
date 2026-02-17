import { EventEmitter } from "eventemitter3";
import type * as THREE from "three/webgpu";
import { defineProps, readOnly } from "../utils/define-props";

/**
 * A utility for initializing core [Three.js](https://threejs.org) entities, managing their setup, and handling rendering.
 * @see {@link https://three-kvy-core.vladkrutenyuk.ru/docs/api/three-context | Official Documentation}
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/core/ThreeContext.ts | Source}
 */
export class ThreeContext extends EventEmitter<ThreeContextEventMap, ThreeContext> {
	/**
	 * (readonly) flag to mark that it is an instance of ThreeContext.
	 * @type {true}
	 */
	public readonly isThreeContext!: true;
	/**
	 * (readonly) instance of Three.js `Renderer` used for rendering your awesome scene.
	 * 
	 * @type {THREE.Renderer}
	 */
	public readonly renderer: THREE.Renderer;

	/**
	 * An instance of Three.js `PerspectiveCamera` camera which is used in rendering. Fires event `camerachanged` on set.
	 */
	public get camera() {
		return this._camera;
	}
	public set camera(value: THREE.PerspectiveCamera) {
		const prevCamera = this._camera;
		this._camera = value;
		this.cameraChanged(value, prevCamera);
	}

	/** (readonly) instance of Three.js `Scene` that contains all objects to be rendered. */
	public readonly scene: THREE.Scene;

	/** (readonly) instance of Three.js `Clock` */
	public readonly clock: THREE.Clock;

	/** (readonly) HTML element where the renderer canvas is appended on mount. */
	public get container(): HTMLDivElement | null {
		return this._container;
	}
	/**
	 * (readonly) flag to check if the renderer canvas is currently mounted.
	 * @type {boolean}
	 */
	public get isMounted(): boolean {
		return this._isMounted;
	}
	/**
	 * (readonly) flag to check whether this instance has been destroyed.
	 */
	public get isDestroyed(): boolean {
		return this._isDestroyed;
	}

	private _camera: THREE.PerspectiveCamera;
	private _container: HTMLDivElement | null = null;
	private _resizeObserver: ResizeObserver | null = null;
	private _isMounted = false;
	private _isDestroyed = false;

	private _srcRenderFn = () => {
		this.renderer.render(this.scene, this._camera);
	};
	private _renderFn = this._srcRenderFn;

	/**
	 * This creates a new {@link ThreeContext} instance.
	 * @param {THREE.Renderer} renderer - An instance of Three.js `Renderer`
	 * @param {THREE.PerspectiveCamera} camera - An instance of Three.js `PerspectiveCamera`
	 * @param {THREE.Scene} scene - An instance of Three.js `Scene`
	 * @param {THREE.Clock} clock - An instance of Three.js `Clock`
	 */
	constructor(
		renderer: THREE.Renderer,
		camera: THREE.PerspectiveCamera,
		scene: THREE.Scene,
		clock: THREE.Clock
	) {
		super();
		defineProps(this, { isThreeContext: readOnly(true) });
		this.renderer = renderer;
		this.scene = scene;
		this._camera = camera;
		this.clock = clock;
		this._renderFn = this._srcRenderFn;
	}

	/**
	 * Renders the scene using the current render function. Fires `renderbefore` and `renderafter` events.
	 */
	render() {
		this.emit(ev.RenderBefore);
		this._renderFn();
		this.emit(ev.RenderAfter);
	}

	/**
	 * Overrides the render function with a custom implementation.
	 * @param {Function} fn
	 * @returns
	 */
	overrideRender(fn: () => void) {
		this._renderFn = fn;
		return this;
	}

	/**
	 * Resets the render function to its default implementation.
	 */
	resetRender() {
		this._renderFn = this._srcRenderFn;
		return this;
	}

	/**
	 * Append the renderer canvas to the given HTML container, initializes event listeners and resize observer.
	 * Fires `mount` event.
	 * @param {HTMLDivElement} container -  The HTML container element where to mount (append) renderer canvas.
	 */
	mount(container: HTMLDivElement) {
		if (this._isMounted || this._isDestroyed) return;
		this._isMounted = true;

		const canvas = this.renderer.domElement;

		this._container = container;
		container.append(canvas);
		canvas.tabIndex = 0;
		canvas.style.touchAction = "none";
		// canvas.focus();

		this.emit(ev.Mount, container);

		this._resizeObserver = new ResizeObserver(this.resizeHandler);
		this._resizeObserver.observe(container);
		this.resizeHandler();

		return this;
	}

	/**
	 * Remove the renderer canvas from DOM it was mounted, removes event listeners, disconnect resize observer.
	 * Fires `"unmount"` event.
	 */
	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.emit(ev.Unmount);

		return this;
	}

	/**
	 * Destroys this instance, releasing resources and preventing further rendering.
	 * Fires `"destroy"` event.
	 */
	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;

		const noRender = () => {
			console.error("render is called after ThreeContext is destroyed.");
		};
		this._renderFn = noRender;
		this._srcRenderFn = noRender;

		this.unmount();
		// this.clearScene(true);
		this.renderer.dispose();

		this.emit(ev.Destroy);

		Object.values(ev).forEach((x) => this.removeAllListeners(x));
	}

	private resizeHandler = () => {
		const container = this._container;
		if (!container) return;

		const width = container.offsetWidth;
		const height = container.offsetHeight;

		const camera = this._camera;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.emit(ev.Resize, width, height);
		this.render();
	};

	private cameraChanged(
		newCamera: THREE.PerspectiveCamera,
		prevCamera: THREE.PerspectiveCamera
	) {
		const camera = this._camera;
		const root = this._container;
		if (root) {
			camera.aspect = root.offsetWidth / root.offsetHeight;
		}
		camera.updateProjectionMatrix();
		this.emit(ev.CameraChanged, newCamera, prevCamera);
	}
}

const ev = Object.freeze({
	RenderBefore: "renderbefore",
	RenderAfter: "renderafter",
	Mount: "mount",
	Unmount: "unmount",
	Destroy: "destroy",
	CameraChanged: "camerachanged",
	Resize: "resize",
});

export type ThreeContextEventMap = {
	[ev.RenderBefore]: [];
	[ev.RenderAfter]: [];
	[ev.Mount]: [root: HTMLDivElement];
	[ev.Unmount]: [];
	[ev.Destroy]: [];
	[ev.Resize]: [width: number, height: number];
	[ev.CameraChanged]: [
		newCamera: THREE.PerspectiveCamera,
		prevCamera: THREE.PerspectiveCamera,
	];
};
