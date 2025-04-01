import * as THREE from "three";
import KVY from "../lib.js";

//* This camera controller is based on spherical coords.
//* So it uses 'phi', 'theta', 'radius' to describe transfroms
//* in short, 'radius' is distance from target to camera, 'phi' is vertical changes, 'theta' is horizontal
//* Check it to fresh knowledges -> https://mathinsight.org/spherical_coordinates :)

const _sph = new THREE.Spherical();
const _vt = new THREE.Vector3();

export enum CameraThetaAutoAlignMode {
	None,
	OnlyOnForwardMovement,
	Everytime,
}
export default class PlayerCameraControllerGof extends KVY.Object3DFeature {
	/** @type {THREE.PerspectiveCamera} */
	camera;

	/** @default x = 0.008, y = 000.8 */
	sensitivity = {
		x: 0.008,
		y: 0.008,
	};
	zoomSensitivity = 0.5;

	autoThetaAlignMode = CameraThetaAutoAlignMode.None;

	/** @default true */
	allowManualContolling = true;

	/** @default false */
	autoRestorePhiToFixed = false;

	minPhi = THREE.MathUtils.degToRad(5);
	maxPhi = THREE.MathUtils.degToRad(120);
	targetPhi = THREE.MathUtils.degToRad(60);
	targetRadius = 8;
	minRadius = 0.5;
	maxRadius = 20;

	private readonly _target: THREE.Object3D;
	// private readonly _movementInputGof: MovementInputGof;
	// private readonly _raycaster: THREE.Raycaster;
	_raycastDirection = new THREE.Vector3();
	private _obstacles: THREE.Object3D[] | null = null;
	private _theta: number = 0; // yaw (around Y), rad
	private _phi: number = this.targetPhi; // pitch (around X), rad
	private _radius: number = this.targetRadius;
	private _collisionShrinkedRadius: number | null = null;
	private _isManualControlling = false;

	private readonly _oppositeTargetWorldDirection = new THREE.Vector3();
	private readonly _targetWorldDirection = new THREE.Vector3();
	private readonly _targetWorldPos = new THREE.Vector3();

	private readonly _cameraOffsetVector = new THREE.Vector3().setFromSphericalCoords(
		this._radius,
		this._phi,
		this._theta
	);

	constructor(object, props) {
		super(object);
		this._movementInputGof = props.movementInputGof;

		this._target = new THREE.Group();
		this.object.add(this._target);
		this._target.position.set(0, 1.9, 0);

		this.camera = this.ctx.camera;

		this._raycaster = new THREE.Raycaster();
		this._raycastDirection = new THREE.Vector3();

		this.ctx.input.on("wheel", this.onWheel);
	}

	setObstacles(array: THREE.Object3D[] | null) {
		this._obstacles = array;
	}

	protected onDestroy(): void {
		this.ctx.input.off("wheel", this.onWheel);
		this.gameObject.remove(this._target);
		this._obstacles = null;
	}

	/** @param {KVY.CoreContext} ctx  */
	onBeforeRender(ctx) {
		this._target.getWorldPosition(this._targetWorldPos);
		this._target.getWorldDirection(this._targetWorldDirection);
		this._oppositeTargetWorldDirection.copy(this._targetWorldDirection).negate();

		this.applyManualControlling();
		this.handlePinchToZoom();
		this.autoAlignPhi();
		this.updateRadius();
		this.autoAlignTheta();

		_sph.theta = this._theta;
		_sph.radius = this._radius;
		_sph.phi = this._phi;
		this._cameraOffsetVector.setFromSpherical(_sph);
		this.camera.position.copy(this._targetWorldPos).add(this._cameraOffsetVector);
		this.camera.updateMatrix();
		this.camera.lookAt(this._targetWorldPos);
	}

	private _initialPinchDist: number | null = null;
	private _initialPinchRadius = this._radius;
	private applyManualControlling() {
		this._isManualControlling =
			this.ctx.input.isDragging && this.allowManualContolling;

		if (!this._isManualControlling) return;

		const { pointerDeltaX, pointerDeltaY, activePointers } = this.ctx.input;
		this._theta -= pointerDeltaX * this.sensitivity.x;
		this._theta %= Math.PI * 2;
		this._phi -= pointerDeltaY * this.sensitivity.y;
		this._phi = THREE.MathUtils.clamp(this._phi, this.minPhi, this.maxPhi);
	}

	private handlePinchToZoom() {
		const { activePointers, isDragging } = this.ctx.input;
		if (isDragging && activePointers.size === 2) {
			const activePointersIterable = activePointers.values();
			const pointer1 = activePointersIterable.next().value;
			const pointer2 = activePointersIterable.next().value;
			const dx = pointer1.clientX - pointer2.clientX;
			const dy = pointer1.clientY - pointer2.clientY;
			const currentDist = Math.sqrt(dx * dx + dy * dy);
			if (this._initialPinchDist === null) {
				// on start pinch
				this._initialPinchDist = currentDist;
				this._initialPinchRadius = this.targetRadius;
			} else {
				// on move pinch
				const zoomFactor = THREE.MathUtils.lerp(
					1,
					this._initialPinchDist / currentDist,
					this.zoomSensitivity
				);
				this.targetRadius = THREE.MathUtils.clamp(
					this._initialPinchRadius * zoomFactor,
					this.minRadius,
					this.maxRadius
				);
			}
		} else if (this._initialPinchDist !== null) {
			// on end pinch
			this._initialPinchDist = null;
		}
	}
	private autoAlignPhi() {
		if (!this._isManualControlling && this.autoRestorePhiToFixed) {
			this._phi = THREE.MathUtils.lerp(
				this._phi,
				this.targetPhi,
				this.ctx.deltaTime
			);
		}
	}

	private updateRadius() {
		this.checkCollisionsToShrinkRadius();
		this._radius =
			this._collisionShrinkedRadius ??
			THREE.MathUtils.lerp(
				this._radius,
				this.targetRadius,
				this.ctx.deltaTime * 10
			);
	}

	private autoAlignTheta() {
		if (this._isManualControlling) return;
		let lerpFactor = 1;
		switch (this.autoThetaAlignMode) {
			case CameraThetaAutoAlignMode.None:
				return;
			case CameraThetaAutoAlignMode.OnlyOnForwardMovement:
				const hasForwardMovement = this._movementInputGof.vector.z > 0;
				if (!hasForwardMovement) return;
				lerpFactor = 2;
				break;
			case CameraThetaAutoAlignMode.Everytime:
				lerpFactor = 10;
				break;
		}
		// lerp safely theta via vectors, not directly as angle values
		_sph.theta = this._theta;
		_sph.phi = Math.PI / 2;
		_sph.radius = 1;
		_vt.setFromSpherical(_sph);
		_vt.lerp(this._oppositeTargetWorldDirection, this.ctx.deltaTime * lerpFactor);
		_sph.setFromVector3(_vt);
		this._theta = _sph.theta;
	}

	private checkCollisionsToShrinkRadius(): number | null {
		//TODO rewrite via CANNON's raycast throught all physics world bodies
		//* better in perfomance way
		//* works independently for all coliders, no need to push obstacles mesh from different level components

		if (!this._obstacles) {
			return null;
		}

		this._raycastDirection
			.subVectors(this.camera.position, this._targetWorldPos)
			.normalize();
		this._raycaster.set(this._targetWorldPos, this._raycastDirection);

		const intersects = this._raycaster.intersectObjects(this._obstacles, true);

		this._collisionShrinkedRadius = null;
		if (intersects.length > 0) {
			const intersection = intersects[0];
			if (intersection.distance < this.targetRadius) {
				const newFixedRadius = Math.max(
					intersection.point.distanceTo(this._targetWorldPos) - 0.15,
					0.05
				);
				this._collisionShrinkedRadius = newFixedRadius;
			}
		}

		return this._collisionShrinkedRadius;
	}

	private onWheel = (event: globalThis.WheelEvent) => {
		const delta = THREE.MathUtils.lerp(0, event.deltaY * 0.05, this.zoomSensitivity);
		this.targetRadius = THREE.MathUtils.clamp(
			this.targetRadius + delta,
			this.minRadius,
			this.maxRadius
		);
	};
}
