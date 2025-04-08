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
const { assertDefined } = utils;

type ColliderType = keyof typeof RAPIER.ColliderDesc;
type ColliderParams<T extends ColliderType = ColliderType> =
	//@ts-expect-error huy
	T extends ColliderType ? [T, ...Parameters<(typeof RAPIER.ColliderDesc)[T]>] : never;

export class Collider extends Object3DFeature<ModulesWithRapierPhysics> {
	public get col() {
		return assertDefined(this._col, "col");
	}
	private _col?: RAPIER.Collider;
	private _params: ColliderParams;

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
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) throw new Error("'RapierPhysics' is not found in context");

		const world = rapier.world;
		const RAPIER = rapier.api;

		const [type, ...args] = this._params;
		//@ts-expect-error huy
		const desc = RAPIER.ColliderDesc[type](...args);
		if (!desc) throw new Error("Collider type is incorrect");

		//TODO проверять что коллайдер heightfield или trimesh и запрещать их соединять с динам/кинемат rigidbody
		const rbF = getFeatureBy<Rigidbody>(
			this.object,
			(x) => x.isRigidbody
		);
		const rb = rbF?.rb ?? undefined;
		if (!rb) {
			const pos = this.object.getWorldPosition(_v);
			const quat = this.object.getWorldQuaternion(_qt);
			desc.setTranslation(pos.x, pos.y, pos.z).setRotation(quat);
		}

		const collider = world.createCollider(desc, rb);
		if (this._setter){
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
