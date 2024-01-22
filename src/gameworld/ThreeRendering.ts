import * as THREE from 'three'
import { fullObjectDispose } from './utils/full-object-dispose'

export type ThreeRenderingEventMap = {
	beforeRender: {}
	afterRender: {}
	mount: {}
	unmount: {}
	destroy: {}
	resize: {
		width: number
		height: number
	}
}

const _emptyFn = () => {}
const _event: {
	[K in keyof ThreeRenderingEventMap]: { type: K } & ThreeRenderingEventMap[K]
} = {
	beforeRender: { type: 'beforeRender' },
	afterRender: { type: 'afterRender' },
	mount: { type: 'mount' },
	unmount: { type: 'unmount' },
	destroy: { type: 'destroy' },
	resize: { type: 'resize', width: 100, height: 100 },
}

export type ThreeRenderingProps = {
	rendererParams?: THREE.WebGLRendererParameters
	cameraParams?: {
		fov?: number
		near?: number
		far?: number
	}
}
export default class ThreeRendering extends THREE.EventDispatcher<ThreeRenderingEventMap> {
	public readonly renderer: THREE.WebGLRenderer
	public readonly scene: THREE.Scene
	public readonly camera: THREE.PerspectiveCamera
	//TODO make option to choose between OrthographicCamera and PerspectiveCamera

	private _isMounted = false
	public get isMounted() {
		return this._isMounted
	}
	private _root: HTMLDivElement | null = null
	get root() {
		return this._root
	}
	private _resizeObserver: ResizeObserver | null = null

	private _isDestroyed = false
	public get isDestroyed() {
		return this._isDestroyed
	}

	private _renderFn = _emptyFn

	constructor(props?: ThreeRenderingProps) {
		super()

		this.renderer = new THREE.WebGLRenderer(props?.rendererParams)
		// this.renderer.setPixelRatio(window.devicePixelRatio)
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			props?.cameraParams?.fov,
			1,
			props?.cameraParams?.near,
			props?.cameraParams?.far
		)

		this._renderFn = () => {
			this.renderer.render(this.scene, this.camera)
		}
	}

	render() {
		this.dispatchEvent(_event.beforeRender)
		this._renderFn()
		this.dispatchEvent(_event.afterRender)
	}

	overrideRenderFn(fn: () => void) {
		this._renderFn = fn
	}

	mount(root: HTMLDivElement) {
		if (this._isMounted) return
		this._isMounted = true

		this._root = root
		this._root.append(this.renderer.domElement)
		this._resizeObserver = new ResizeObserver(this.resizeHandler)
		this._resizeObserver.observe(this._root)
		this.resizeHandler()

		this.renderer.domElement.tabIndex = 0
		this.renderer.domElement.style.touchAction = 'none'
		this.renderer.domElement.focus()

		this.dispatchEvent(_event.mount)
	}

	unmount() {
		if (!this._isMounted) return
		this._isMounted = false

		this._resizeObserver?.disconnect()
		this._resizeObserver = null
		this.renderer.domElement.remove()

		this.dispatchEvent(_event.unmount)
	}

	destroy() {
		if (this._isDestroyed) return
		this._isDestroyed = true

		this.render = _emptyFn
		this.unmount()
		this.clearScene(true)
		this.renderer.dispose()
		this.dispatchEvent(_event.destroy)
	}

	private clearScene(dispose?: boolean) {
		const children = [...this.scene.children]
		for (let i = 0; i < children.length; i++) {
			const child = children[i]
			this.scene.remove(child)
			dispose && fullObjectDispose(child, true)
		}
	}

	private resizeHandler = () => {
		if (!this._root) return

		const width = this._root.offsetWidth
		const height = this._root.offsetHeight

		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(width, height)

		_event.resize.width = width
		_event.resize.height = height
		this.dispatchEvent(_event.resize)
	}
}
