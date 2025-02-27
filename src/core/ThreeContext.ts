import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { disposeObject3DFully } from "../utils/dispose-object3d";

/**
 * Manages the Three.js rendering context, including the renderer, scene, and camera.
 * Provides lifecycle methods for mounting, unmounting, and destroying the rendering context.
 * Also allows overriding and resetting the render function.
 */
export class ThreeContext extends EventEmitter<ThreeContextEventMap, ThreeContext> {
	/**
	 * The WebGL renderer used for rendering the scene.
	 */
	public readonly renderer: THREE.WebGLRenderer;
	/**
	 * The scene that contains all objects to be rendered.
	 */
	public readonly scene: THREE.Scene;
	/**
	 * The active camera used for rendering.
	 */
	public get camera() {
		return this._camera;
	}
	/**
	 * Sets the active camera and triggers a camera change event.
	 */
	public set camera(value: THREE.PerspectiveCamera) {
		this._camera = value;
		this.cameraChanged();
	}
	/**
	 * The root HTML element where the renderer is mounted.
	 */
	public get root() {
		return this._root;
	}
	/**
	 * Indicates whether the renderer is currently mounted.
	 */
	public get isMounted() {
		return this._isMounted;
	}
	/**
	 * Indicates whether the context has been destroyed.
	 */
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _camera: THREE.PerspectiveCamera;
	private _root: HTMLDivElement | null = null;
	private _resizeObserver: ResizeObserver | null = null;
	private _isMounted = false;
	private _isDestroyed = false;

	private _srcRenderFn = () => {
		this.renderer.render(this.scene, this._camera);
	};
	private _renderFn = this._srcRenderFn;

	/**
	 * Creates a new ThreeContext instance.
	 * @param renderer The WebGL renderer.
	 * @param camera The perspective camera.
	 * @param scene The Three.js scene.
	 */
	constructor(
		renderer: THREE.WebGLRenderer,
		camera: THREE.PerspectiveCamera,
		scene: THREE.Scene
	) {
		super();

		this.renderer = renderer;
		this.scene = scene;
		this._camera = camera;
		this._renderFn = this._srcRenderFn;
	}

	/**
	 * Renders the scene using the current render function.
	 * Emits `renderbefore` and `renderafter` events.
	 */
	render() {
		this.emit(ev.RenderBefore);
		this._renderFn();
		this.emit(ev.RenderAfter);
	}

	/**
	 * Overrides the render function with a custom implementation.
	 * @param fn The new render function.
	 */
	overrideRenderFn(fn: () => void) {
		this._renderFn = fn;
	}

	/**
	 * Resets the render function to its default implementation.
	 */
	resetRenderFn() {
		this._renderFn = this._srcRenderFn;
	}

	/**
	 * Mounts the renderer to the specified HTML container and initializes event listeners.
	 * @param root The HTML container element.
	 */
	mount(root: HTMLDivElement) {
		if (this._isMounted) return;
		this._isMounted = true;

		const canvas = this.renderer.domElement;

		this._root = root;
		root.append(canvas);
		this._resizeObserver = new ResizeObserver(this.resizeHandler);
		this._resizeObserver.observe(root);
		this.resizeHandler();

		canvas.tabIndex = 0;
		canvas.style.touchAction = "none";
		canvas.focus();

		this.emit(ev.Mount, root);
	}

	/**
	 * Unmounts the renderer from the HTML container and removes event listeners.
	 */
	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.emit(ev.Unmount);
	}

	/**
	 * Destroys the ThreeContext, releasing resources and preventing further rendering.
	 * Emits a `destroy` event.
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
	}

	/**
	 * Removes all objects from the scene.
	 * Optionally disposes of them to free memory.
	 * @param dispose Whether to dispose of objects after removal.
	 */
	clearScene(dispose?: boolean) {
		const children = [...this.scene.children];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			this.scene.remove(child);
			dispose && disposeObject3DFully(child, true);
		}
	}

	private _rendererSetSizeTimeout: number | null = null;
	private resizeHandler = () => {
		const root = this._root;
		if (!root) return;

		const width = root.offsetWidth;
		const height = root.offsetHeight;

		const camera = this._camera;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		const timeout = this._rendererSetSizeTimeout;
		if (timeout) {
			window.clearTimeout(timeout);
		}
		this._rendererSetSizeTimeout = window.setTimeout(() => {
			this.renderer.setSize(width, height);
			this.emit(ev.Resize, width, height);
		}, 5);

		// this.emit(ev.Resize, width, height);
	};

	private cameraChanged() {
		const camera = this._camera;
		const root = this._root;
		if (root) {
			camera.aspect = root.offsetWidth / root.offsetHeight;
		}
		camera.updateProjectionMatrix();
		this.emit(ev.CameraChanged, camera);
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
	[ev.CameraChanged]: [camera: THREE.PerspectiveCamera];
};
