import * as THREE from "three";
import KVY from "../KVY.js";
import { KeysInput } from "../../addons/input/KeysInput.js";
import { RigidbodyKinematic, RapierPhysics, CapsuleCollider, Collider } from "../../addons/rapier-physics/index.js";

export class KinematicController extends KVY.Object3DFeature {
	/** @type {import("@dimforge/rapier3d-compat").KinematicCharacterController} */
	kcc;

	/** @type {import("@dimforge/rapier3d-compat").RigidBody} */
	rb;

	/** @type {import("@dimforge/rapier3d-compat").Collider} */
	collider;

	speed = 6;

	_moveDir = new THREE.Vector3();
	_translDelta = new THREE.Vector3();

	halfHeight;
	radius;
	offset;

	/** @type {RapierPhysics} */
	_rapier;

	constructor(object, props) {
		super(object);
		this.halfHeight = props?.halfHeight || 0.85;
		this.radius = props?.radius || 0.5;
		this.offset = props?.offset || 0.05;
	}

	/** @param {KVY.CoreContext} ctx */
	useCtx(ctx) {
		console.log(`-> KinematicController useCtx`);
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) throw new Error("'RapierPhysics' is not found in context");
		this._rapier = rapier;

		const obj = this.object;

		// /** @type {RigidbodyKinematic} */
		// const rbkF = KVY.getFeature(obj, RigidbodyKinematic);
		// if (!rbkF)
		// 	throw new Error(
		// 		"RigidbodyKinematic feature must be added to this object for KinematicController"
		// 	);

		// const rb = rbkF.rb;
		// this.rb = rb;
		// if (rb.numColliders === 0) throw new Error("Number of colliders is 0");

		// const collider = rb.collider(0);
		// if (!collider) throw new Error("Collider is null or undefined");

		const colliderProps = [this.halfHeight, this.radius];

		const rbF = KVY.addFeature(obj, RigidbodyKinematic);
		// const colliderF = KVY.addFeature(obj, Collider, ["capsule",...colliderProps]);
		const colliderF = KVY.addFeature(obj, CapsuleCollider, colliderProps);
		this.rb = rbF.rb;
		this.collider = colliderF.col;

		// /** @type {Collider|null} */
		// const colliderF = KVY.getFeature(this.object, Collider);
		// if (!colliderF) throw "collider feature is required";
		// this.collider = colliderF.collider;

		const world = rapier.world;
		const RAPIER = rapier.api;

		const kcc = world.createCharacterController(this.offset);
		// Don’t allow climbing slopes larger than 45 degrees.
		kcc.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
		// Automatically slide down on slopes smaller than 30 degrees.
		kcc.setMinSlopeSlideAngle((30 * Math.PI) / 180);

		kcc.enableSnapToGround(0.4);
		kcc.setApplyImpulsesToDynamicBodies(true);
		
		// Autostep if the step height is smaller than 0.5, its width is larger than 0.2,
		// and allow stepping on dynamic bodies.
		kcc.enableAutostep(0.3, 0.2, false); 

		this.kcc = kcc;

		rapier.on("stepbefore", this.onStep);

		return () => {
			rapier.off("stepbefore", this.onStep);
			world.removeCharacterController(kcc);
			this._rapier = undefined;
		};
	}

	onStep = () => {
		this.update();
	}

	_velY = 0;
	/** @param {KVY.CoreContext<{keys: KeysInput, rapier: RapierPhysics}>} ctx */
	onBeforeRender(ctx) {
		// this.update();
	}

	update = () => {
		/** @type {KVY.CoreContext<{keys: KeysInput, rapier: RapierPhysics}>} ctx */
		const ctx = this.ctx;
		const timeStep = this._rapier.timeStep
		const dt = timeStep === "vary" ? ctx.deltaTime : timeStep;

		const kcc = this.kcc;
		const rb = this.rb;
		const rapier = this._rapier;
		// 1️⃣ Движение по XZ (горизонтальное)
		// - movement direction
		const dir = _vt.setScalar(0);

		const key = ctx.modules.keys.has;

		if (key("KeyW")) dir.z -= 1;
		if (key("KeyS")) dir.z += 1;
		if (key("KeyD")) dir.x += 1;
		if (key("KeyA")) dir.x -= 1;

		dir.normalize();

		this._moveDir.lerp(dir, dt * 10);

		// - apply scalar
		const scalar = this.speed * dt;
		const movement = _vt;
		_vt.copy(this._moveDir).multiplyScalar(scalar);

		// 2️⃣ Обновляем вертикальную скорость (гравитация)
		if (this._isGrounded) {
			this._velY = 0;
			if (key("Space")) {
				this._velY = 10;
			}
			console.log("grnd");
		} else {
			console.log("not grounded");
			const g = rapier.world.gravity.y * 2;
			this._velY += g * dt;
		}
		movement.y += this._velY * dt;

		// учитываем возможную платформу
		this.takeIntoAccountPlatform();
		const platform = this._platform;
		if (platform?.rb) {
			// console.log("on platform!");
			movement.x += platform.dx;
			movement.y += platform.dy;
			movement.z += platform.dz;
		}

		// 4️⃣ Вычисляем движение с учетом коллизий
		kcc.computeColliderMovement(this.collider, movement);
		const correctedMovement = kcc.computedMovement();

		// 5️⃣ Обновляем позицию вручную
		const newTranslatation = _vt
			.copy(this.collider.translation())
			.add(correctedMovement);
		this.rb.setNextKinematicTranslation(newTranslatation);
		// this.collider.setTranslation(newTranslatation);

		// 6️⃣ Проверяем, стоит ли персонаж на земле
		this._isGrounded = kcc.computedGrounded();
		this.hitGround();

		// sync object3d with rigidbody collider
		_vt.copy(this.collider.translation());
		const obj = this.object;
		if (obj.parent) {
			obj.parent.worldToLocal(_vt);
			obj.position.copy(_vt);
		}

		const RAPIER = rapier.api;
		const world = rapier.world;
	}

	_hitGround;
	
	hitGround() {
		/** @type {KVY.CoreContext<{keys: KeysInput, rapier: RapierPhysics}>} ctx */
		const ctx = this.ctx;
		const rapier = this._rapier;

		const rayOrigin = this.collider.translation();
		rayOrigin.y -= this.radius + this.halfHeight + this.offset + 0.01;
		let ray = new rapier.api.Ray(rayOrigin, down);
		const hitGround = rapier.world.castRay(ray, 0.4, true);

		// const hitRb = hitGround?.collider.parent();
		this._hitGround = hitGround;
	}

	_platform = { rb: null, lastPos: null, dx: 0, dy: 0, dz: 0 };

	takeIntoAccountPlatform() {
		/** @type {KVY.CoreContext<{keys: KeysInput, rapier: RapierPhysics}>} ctx */
		const ctx = this.ctx;
		const rb = this.rb;
		const rapierModule = this._rapier;
		const platform = this._platform;

		const hitGround = this._hitGround;
		const hitRb = hitGround?.collider.parent();

		const rbType = rapierModule.api.RigidBodyType;
		if (
			!hitGround ||
			!hitRb ||
			hitRb === rb ||
			!(
				hitRb.bodyType() === rbType.KinematicPositionBased ||
				hitRb.bodyType() === rbType.KinematicVelocityBased
			)
		) {
			platform.rb = null;
			platform.lastPos = null;
			platform.dx = 0;
			platform.dy = 0;
			platform.dz = 0;
			return;
		}
		const currentPlatformRb = hitRb;

		if (platform.rb !== currentPlatformRb) {
			// Если персонаж встал на другую платформу
			platform.rb = currentPlatformRb;
			platform.lastPos = currentPlatformRb.translation();
		} else {
			// Если персонаж на той же платформе, двигаем его вместе с ней
			const platformPos = platform.rb.translation();
			platform.dx = platformPos.x - platform.lastPos.x;
			platform.dy = platformPos.y - platform.lastPos.y;
			platform.dz = platformPos.z - platform.lastPos.z;

			platform.lastPos = { ...platformPos };
		}
	}
}

const _vt = new THREE.Vector3();

const down = { x: 0, y: -1, z: 0 };
