import * as THREE from "three";
import KVY from "../lib.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { InputKeyModule } from "../InputKeyModule.js";
import { RigidbodyKinematic } from "./RigidbodyKinematic.js";
import { Collider } from "./Collider.js";

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

	constructor(object, props) {
		super(object);
		this.halfHeight = props?.halfHeight || 0.85;
		this.radius = props?.radius || 0.5;
		this.offset = props?.offset || 0.01;
	}

	/** @param {KVY.CoreContext} ctx */
	useCtx(ctx) {
		console.log(`-> KinematicController useCtx`);
		const error = RapierPhysics.validateCtx(ctx);
		if (error) throw new Error(error);
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

		const colliderProps = ["capsule", this.halfHeight, this.radius];

		const rbF = KVY.addFeature(obj, RigidbodyKinematic);
		const colliderF = KVY.addFeature(obj, Collider, colliderProps);
		this.rb = rbF.rb;
		this.collider = colliderF.collider;

		// /** @type {Collider|null} */
		// const colliderF = KVY.getFeature(this.object, Collider);
		// if (!colliderF) throw "collider feature is required";
		// this.collider = colliderF.collider;

		/** @type {RapierPhysics} */
		const rapier = ctx.modules.rapier;

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

		return () => {
			world.removeCharacterController(kcc);
		};
	}

	_velY = 0;
	/** @param {KVY.CoreContext<{input: InputKeyModule, rapier: RapierPhysics}>} ctx */
	onBeforeRender(ctx) {
		const dt = ctx.deltaTime;
		const kcc = this.kcc;
		const rb = this.rb;
		const rapierModule = ctx.modules.rapier;
		// 1️⃣ Движение по XZ (горизонтальное)
		// - movement direction
		const dir = _vt.setScalar(0);

		const key = ctx.modules.input.isKeyDown;
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
			const g = ctx.modules.rapier.world.gravity.y * 2;
			this._velY += g * dt;
		}
		movement.y += this._velY * dt;

		// учитываем возможную платформу
		this.takeIntoAccountPlatform(ctx);
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
		this.hitGround(ctx);

		// sync object3d with rigidbody collider
		_vt.copy(this.collider.translation());
		const obj = this.object;
		if (obj.parent) {
			obj.parent.worldToLocal(_vt);
			obj.position.copy(_vt);
		}

		const RAPIER = rapierModule.api;
		const world = rapierModule.world;
	}

	_hitGround;
	/** @param {KVY.CoreContext<{input: InputKeyModule, rapier: RapierPhysics}>} ctx */
	hitGround(ctx) {
		const rapierModule = ctx.modules.rapier;

		const rayOrigin = this.collider.translation();
		rayOrigin.y -= this.radius + this.halfHeight + this.offset + 0.01;
		let ray = new rapierModule.api.Ray(rayOrigin, down);
		const hitGround = rapierModule.world.castRay(ray, 0.4, true);

		// const hitRb = hitGround?.collider.parent();
		this._hitGround = hitGround;
	}

	_platform = { rb: null, lastPos: null, dx: 0, dy: 0, dz: 0 };

	/** @param {KVY.CoreContext<{input: InputKeyModule, rapier: RapierPhysics}>} ctx */
	takeIntoAccountPlatform(ctx) {
		const rb = this.rb;
		const rapierModule = ctx.modules.rapier;
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
