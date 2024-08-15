import * as THREE from "three";
import { fullObjectDispose } from "../utils/three/full-object-dispose";

export type ThreeRenderingEventMap = {
	beforeRender: {};
	afterRender: {};
	mount: {
		root: HTMLDivElement
	};
	unmount: {};
	destroy: {};
	resize: {
		width: number;
		height: number;
	};
};

export type ThreeRenderingProps = {
	renderer?: THREE.WebGLRendererParameters;
	camera?: {
		fov?: number;
		near?: number;
		far?: number;
	};
};

export class ThreeContext extends THREE.EventDispatcher<ThreeRenderingEventMap> {
	public readonly renderer: THREE.WebGLRenderer;
	public readonly scene: THREE.Scene;
	public camera: THREE.PerspectiveCamera;

	public get root() {
		return this._root;
	}
	public get isMounted() {
		return this._isMounted;
	}
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _root: HTMLDivElement | null = null;
	private _resizeObserver: ResizeObserver | null = null;
	private _isMounted = false;
	private _isDestroyed = false;

	private _renderFn = _emptyFn;

	constructor(props?: ThreeRenderingProps) {
		super();

		this.renderer = new THREE.WebGLRenderer(props?.renderer);
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			props?.camera?.fov,
			1,
			props?.camera?.near,
			props?.camera?.far
		);

		this._renderFn = () => {
			this.renderer.render(this.scene, this.camera);
		};
	}

	render() {
		this.dispatchEvent(_event.beforeRender);
		this._renderFn();
		this.dispatchEvent(_event.afterRender);
	}

	overrideRenderFn(fn: () => void) {
		this._renderFn = fn;
	}

	resetRenderFn() {
		this._renderFn = _emptyFn;
	}

	mount(root: HTMLDivElement) {
		if (this._isMounted) return;
		this._isMounted = true;

		this._root = root;
		this._root.append(this.renderer.domElement);
		this._resizeObserver = new ResizeObserver(this.resizeHandler);
		this._resizeObserver.observe(this._root);
		this.resizeHandler();

		this.renderer.domElement.tabIndex = 0;
		this.renderer.domElement.style.touchAction = "none";
		this.renderer.domElement.focus();

		_event.mount.root = root
		this.dispatchEvent(_event.mount);
	}

	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.dispatchEvent(_event.unmount);
	}

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;

		this.render = _emptyFn;
		this.unmount();
		this.clearScene(true);
		this.renderer.dispose();
		this.dispatchEvent(_event.destroy);
	}

	private clearScene(dispose?: boolean) {
		const children = [...this.scene.children];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			this.scene.remove(child);
			dispose && fullObjectDispose(child, true);
		}
	}

	private resizeHandler = () => {
		if (!this._root) return;

		const width = this._root.offsetWidth;
		const height = this._root.offsetHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);

		_event.resize.width = width;
		_event.resize.height = height;
		this.dispatchEvent(_event.resize);
	};
}

const _emptyFn = () => {};
const _event: {
	[K in keyof ThreeRenderingEventMap]: { type: K } & ThreeRenderingEventMap[K];
} = {
	beforeRender: { type: "beforeRender" },
	afterRender: { type: "afterRender" },
	mount: { type: "mount", root: null as unknown as HTMLDivElement },
	unmount: { type: "unmount" },
	destroy: { type: "destroy" },
	resize: { type: "resize", width: 100, height: 100 },
};
