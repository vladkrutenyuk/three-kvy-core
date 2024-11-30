import * as THREE from "three";
import { removeArrayItem } from "../utils/remove-array-item";
import { traverseAncestorsInterruptible } from "../utils/traverse-ancestors-interruptible";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { Object3DFeature, Object3DFeatureProps } from "./Object3DFeature";

export const Object3DFeaturabilityEvent = {
	FEATURE_ADDED: "featureadded",
	FEATURE_REMOVED: "featureremoved",
} as const;

export type Object3DFeaturabilityEventMap<
	TModules extends GameContextModulesRecord = {}
> = {
	[Object3DFeaturabilityEvent.FEATURE_ADDED]: { feature: Object3DFeature<TModules> };
	[Object3DFeaturabilityEvent.FEATURE_REMOVED]: { feature: Object3DFeature<TModules> };
} & CtxAttachableEventMap<TModules>;

export class Object3DFeaturability<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
> extends THREE.EventDispatcher<Object3DFeaturabilityEventMap<TModules>> {
	/** @warning it works recursively */
	static wrap<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj, recursively: boolean = false): IFeaturable<TModules, TObj> {
		const X = Object3DFeaturability;
		if (recursively) {
			obj.traverse(X.from);
		} else {
			X.from(obj);
		}
		//TODO try find and attach ancestor ctx
		return obj as unknown as IFeaturable<TModules, TObj>;
	}

	static from = <TModules extends GameContextModulesRecord = {}>(obj: THREE.Object3D) =>
		new Object3DFeaturability<TModules, typeof obj>(obj);

	static isIn<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj): obj is IFeaturable<TModules, TObj> {
		const _f = (obj as unknown as IFeaturable<TModules, TObj>).userData.featurability;
		const f = _f as typeof _f | undefined;
		return f !== undefined && f.isObjectFeaturability;
	}

	static extract<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj): Object3DFeaturability<TModules, TObj> | null {
		const _f = (obj as unknown as IFeaturable<TModules, TObj>).userData.featurability;
		const f = _f as typeof _f | undefined;
		return f !== undefined && f.isObjectFeaturability ? f : null;
	}

	static create<
		T extends new (...args: any[]) => THREE.Object3D,
		TModules extends GameContextModulesRecord = {},
		TReturn = IFeaturable<TModules, InstanceType<T>>
	>(ObjClass: T, ...args: ConstructorParameters<T>): TReturn {
		const obj = new ObjClass(...args);
		const featurable = this.wrap<TModules>(obj);
		return featurable as TReturn;
	}

	static log: (target: Object3DFeaturability, msg: string) => void = () => {};

	public readonly isObjectFeaturability = true;
	public readonly object: IFeaturable<TModules, TObj>;
	public get ctx() {
		return this._ctx;
	}
	public get features() {
		return [...this._features];
	}
	private _pair?: [object: IFeaturable<TModules, TObj>, featurability:this]
	public get pair(): [object: IFeaturable<TModules, TObj>, featurability:this] {
		if (!this._pair) {
			this._pair = [this.object, this];
		}
		return this._pair
	}

	private _ctx: GameContext<TModules> | null = null;
	private readonly _features: Object3DFeature<any>[] = [];

	private constructor(obj: TObj) {
		super();
		this.object = obj as IFeaturable<TModules, TObj>;
		obj.addEventListener("added", this.onObjectAdded);
		obj.addEventListener("removed", this.onObjectRemoved);

		Object.defineProperty(obj.userData, "featurability", {
			value: this,
			enumerable: false,
			configurable: true,
		});

		if (obj.parent) {
			this.onObjectAdded({ target: obj.parent });
		}
	}

	destroy() {
		this.detachCtx();
		const obj = this.object;
		obj.removeEventListener("added", this.onObjectAdded);
		obj.removeEventListener("removed", this.onObjectRemoved);

		//TODO: destroy all features

		delete (obj as IFeaturableToDelete).userData.featurability;
	}

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {},
		TProps extends {} = {}
	>(
		feature: new (
			p: Object3DFeatureProps<
				CompatibleModules<TFeatureModules, TFeatureModules>,
				TProps
			>
		) => TFeature,
		props: TProps,
		beforeAttach?: (feature: TFeature) => void
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {}
	>(
		feature: new (
			p: Object3DFeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props?: undefined,
		beforeAttach?: (feature: TFeature) => void
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {}
	>(
		feature: new (
			p: Object3DFeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props: unknown,
		beforeAttach?: (feature: TFeature) => void
	): TFeature {
		const object = this.object as unknown as IFeaturable<
			CompatibleModules<TFeatureModules, TModules>
		>;
		const instance = new feature(props ? { ...props, object } : { object });
		beforeAttach && beforeAttach(instance);
		this._features.push(instance);
		instance._init_();

		_event[Object3DFeaturabilityEvent.FEATURE_ADDED].feature = instance;
		this.dispatchEvent(_event[Object3DFeaturabilityEvent.FEATURE_ADDED]);

		return instance;
	}

	getFeature<TFeatureClass extends typeof Object3DFeature>(
		FeatureClass: TFeatureClass
	): InstanceType<TFeatureClass> | null {
		return (this._features.find(
			(feature) => Object.getPrototypeOf(feature) === FeatureClass.prototype
		) ?? null) as InstanceType<TFeatureClass> | null;
	}

	destroyFeature<TFeature extends Object3DFeature<any>>(feature: TFeature) {
		this._log(`destroying feature...`);
		const foundAndRemoved = removeArrayItem(this._features, feature);
		if (foundAndRemoved) {
			feature.destroy();

			_event[Object3DFeaturabilityEvent.FEATURE_REMOVED].feature = feature;
			this.dispatchEvent(_event[Object3DFeaturabilityEvent.FEATURE_REMOVED]);
		}
	}

	/** @warning You should be careful to use this method manually. */
	setCtx(ctx: GameContext<TModules> | null) {
		if (ctx) {
			this.attachCtx(ctx);
		} else {
			this.detachCtx();
		}
		return this;
	}

	rename(name:string): this {
		this.object.name = name;
		return this;
	}

	private onObjectAdded = ({ target }: { target: THREE.Object3D }) => {
		this._log("object added");
		const parent = target.parent;
		if (!parent) return;

		if (Object3DFeaturability.isIn<TModules>(parent)) {
			const parentFtblt = parent.userData.featurability;
			this._log("onAdded parent is featurable");
			parentFtblt._ctx && this.attachCtxRecursively(parentFtblt._ctx);
			return;
		}
		this._log("onAdded parent is just object3d");
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы IFeaturable
		let featurableAncestor: IFeaturable<TModules> | null = null;
		traverseAncestorsInterruptible(target, (ancestor: THREE.Object3D) => {
			const isObjectFeaturable = Object3DFeaturability.isIn<TModules>(ancestor);
			if (isObjectFeaturable) {
				featurableAncestor = ancestor;
			}
			return !isObjectFeaturable;
		});
		featurableAncestor = featurableAncestor as IFeaturable<TModules> | null;

		// если нашли и если у него есть мир то аттачимся к нему
		if (featurableAncestor !== null) {
			this._log("onAdded found game object ancestor");
			featurableAncestor.userData.featurability.ctx &&
				this.attachCtxRecursively(featurableAncestor.userData.featurability.ctx);
		}
	};

	private onObjectRemoved = () => {
		this._log("object removed");
		this.detachCtxRecursively();
	};

	private attachCtx(world: GameContext<TModules>) {
		this._log("attachToWorld: ...");
		if (this._ctx !== null) {
			this._log("attachToWorld: there is some world here");
			if (this._ctx !== world) {
				console.error(
					"Cannot attach this object. It had attached to another world."
				);
				return;
			}
			this._log("attachToWorld: this world has already been attached here");
			return;
		}

		this._ctx = world;
		_event[CtxAttachableEvent.ATTACHED_TO_CTX].ctx = this._ctx;
		this.dispatchEvent(_event[CtxAttachableEvent.ATTACHED_TO_CTX]);

		this._log("attachToWorld done!");
	}

	private detachCtx() {
		this._log("detachFromWorld...");
		if (this._ctx === null) return;

		_event[CtxAttachableEvent.DETACHED_FROM_CTX].ctx = this._ctx;
		this._ctx = null;
		this.dispatchEvent(_event[CtxAttachableEvent.DETACHED_FROM_CTX]);

		this._log("detachFromWorld done!");
	}

	private attachCtxRecursively(world: GameContext<TModules>) {
		this._log("attachToWorldRecursively...");
		this.object.traverse((child) => {
			Object3DFeaturability.isIn(child) &&
				child.userData.featurability.attachCtx(world);
		});
	}

	private detachCtxRecursively() {
		this._log("detachFromWorldRecursively...");
		this.object.traverse((child) => {
			Object3DFeaturability.isIn(child) && child.userData.featurability.detachCtx();
		});
	}

	private _log = (msg: string) => {
		Object3DFeaturability.log(this as unknown as Object3DFeaturability, msg);
		// console.log(`OF-${this.ref.id}-${this.ref.name}`, ...args);
	};
}

export type IFeaturable<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
> = TObj & {
	userData: {
		featurability: Object3DFeaturability<TModules, TObj>;
	};
};

type IFeaturableToDelete = {
	userData: Partial<IFeaturable["userData"]>;
};

const _event: {
	[K in keyof Object3DFeaturabilityEventMap<any>]: {
		type: K;
	} & Object3DFeaturabilityEventMap<any>[K];
} = {
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		type: CtxAttachableEvent.ATTACHED_TO_CTX,
		ctx: null as any,
	},
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		type: CtxAttachableEvent.DETACHED_FROM_CTX,
		ctx: null as any,
	},
	[Object3DFeaturabilityEvent.FEATURE_ADDED]: {
		type: Object3DFeaturabilityEvent.FEATURE_ADDED,
		feature: null as any,
	},
	[Object3DFeaturabilityEvent.FEATURE_REMOVED]: {
		type: Object3DFeaturabilityEvent.FEATURE_REMOVED,
		feature: null as any,
	},
};

export type isSubsetRecord<
	TSub extends Record<TKey, TValue>,
	TRecord extends Record<TKey, TValue>,
	TKey extends string | number | symbol = string,
	TValue = any
> = {
	[K in keyof TSub]: K extends keyof TRecord
		? TSub[K] extends TRecord[K]
			? never
			: K
		: K;
}[keyof TSub];

export type CompatibleFeature<
	TFeatureModules extends GameContextModulesRecord,
	TGameObjectModules extends GameContextModulesRecord
> = isSubsetRecord<TFeatureModules, TGameObjectModules> extends never
	? Object3DFeature<TFeatureModules>
	: never;

export type CompatibleModules<
	TSubModules extends GameContextModulesRecord,
	TModules extends GameContextModulesRecord
> = isSubsetRecord<TSubModules, TModules> extends never ? TSubModules : never;
