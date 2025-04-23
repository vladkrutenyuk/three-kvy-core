import type * as RAPIER from "@dimforge/rapier3d-compat";
import {
	getFeatureBy,
	IFeaturable,
	Object3DFeature,
	utils,
} from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";
import { ModulesWithRapierPhysics, RapierPhysics } from "./RapierPhysics";
import { Rigidbody } from "./Rigidbody";
const { assertDefined, traverseUp } = utils;

export type ColliderType = keyof typeof RAPIER.ColliderDesc;
export type ColliderParams<T extends ColliderType = ColliderType> =
	//@ts-expect-error huy
	T extends ColliderType ? [T, ...Parameters<(typeof RAPIER.ColliderDesc)[T]>] : never;

export class Collider extends Object3DFeature<ModulesWithRapierPhysics> {
	public get col(): RAPIER.Collider {
		return assertDefined(this._col, "col");
	}
	private _col?: RAPIER.Collider;
	protected _params: ColliderParams;

	constructor(object: IFeaturable, props: ColliderParams) {
		super(object);
		this._params = props;
	}

	private _setter?: (collider: RAPIER.Collider) => void;

	set(setter: typeof this._setter) {
		const col = this._col;
		if (setter && col) {
			setter(col);
		}
		this._setter = setter;
		return this;
	}

	protected useCtx(ctx: typeof this.ctx) {
		const obj = this.object;
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) throw new Error("'RapierPhysics' is not found in context");

		const world = rapier.world;
		const RAPIER = rapier.api;

		const [type, ...args] = this._params;

		//TODO проверять что коллайдер heightfield или trimesh и запрещать их соединять с динам/кинемат rigidbody

		//@ts-expect-error huy
		const desc = RAPIER.ColliderDesc[type](...args);
		if (!desc) throw new Error("Collider type is incorrect");

		let rbObj: THREE.Object3D | null = null;
		let rb: RAPIER.RigidBody | null | undefined = null;
		rb = getFeatureBy<Rigidbody>(obj, _rbPredic)?.rb;
		if (rb) {
			rbObj = obj;
		} else {
			traverseUp(obj, (ancestor) => {
				const found = getFeatureBy<Rigidbody>(ancestor, _rbPredic)?.rb;
				if (found) {
					rb = found;
					rbObj = ancestor;
				}
				return !found;
			});
		}

		if (!rb) {
			const pos = obj.getWorldPosition(_v);
			const quat = obj.getWorldQuaternion(_qt);
			desc.setTranslation(pos.x, pos.y, pos.z).setRotation(quat);
		} else if (rbObj && rbObj !== obj) {
			// 🧭 Локальная трансформация объекта относительно объекта с телом
			const localPos = _v.set(0, 0, 0);
			const localQuat = _qt.set(0, 0, 0, 1);

			// Вычисляем позицию и кватернион объекта в локальной системе rbObj
			rbObj.worldToLocal(obj.getWorldPosition(localPos));
			const worldQ = obj.getWorldQuaternion(_qt);
			const rbWorldQ = rbObj.getWorldQuaternion(_qt2); // еще один временный кватернион
			localQuat.copy(rbWorldQ.invert()).multiply(worldQ);

			desc.setTranslation(localPos.x, localPos.y, localPos.z).setRotation(
				localQuat
			);
		}

		const collider = world.createCollider(desc, rb);

		if (this._setter) {
			this._setter(collider);
		}
		this._col = collider;
		return () => {
			world.removeCollider(collider, true);
			this._col = undefined;
		};
	}
}

const _v = new THREE.Vector3();
const _qt = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();

const _rbPredic = (x: Rigidbody) => x instanceof Rigidbody;
