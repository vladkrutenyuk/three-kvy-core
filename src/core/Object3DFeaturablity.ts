import * as THREE from "three";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { Object3DFeature, Object3DFeatureProps } from "./Object3DFeature";
import { removeArrayItem } from "../utils/general/remove-array-item";
import { traverseAncestorsInterruptible } from "../utils/three/traverse-ancestors-interruptible";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";

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
	public readonly isObjectFeaturability = true;
	public readonly ref: TObj;

	public get ctx() {
		return this._ctx;
	}

	protected _ctx: GameContext<TModules> | null = null;
	private readonly _features: Object3DFeature<any>[] = [];

	/** @warning it works recursively */
	static wrap<
		TObj extends THREE.Object3D = THREE.Object3D,
		TModules extends GameContextModulesRecord = {}
	>(obj: TObj): IFeaturable<TModules, TObj> {
		obj.traverse(this._newF);
		return obj as unknown as IFeaturable<TModules, TObj>;
	}

	private static _newF = (obj: THREE.Object3D) => new Object3DFeaturability(obj);

	static has<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj): obj is IFeaturable<TModules, TObj> {
		const _f = (obj as unknown as IFeaturable<TModules, TObj>).userData.featurability;
		const f = _f as typeof _f | undefined;
		return f !== undefined && f.isObjectFeaturability;
	}

	static new<
		T extends new (...args: any[]) => THREE.Object3D,
		TModules extends GameContextModulesRecord = {},
		TReturn = IFeaturable<TModules, InstanceType<T>>
	>(ObjClass: T, ...args: ConstructorParameters<T>): TReturn {
		const obj = new ObjClass(...args);
		const featurable = this.wrap<THREE.Object3D, TModules>(obj);
		return featurable as TReturn;
	}

	private constructor(ref: TObj) {
		super();
		this.ref = ref;
		ref.addEventListener("added", this.onAdded);
		ref.addEventListener("removed", this.onRemoved);

		Object.defineProperty(ref.userData, "featurability", {
			value: this,
			enumerable: false,
		});

		if (ref.parent) {
			this.onAdded({ target: ref.parent });
		}
	}

	destroy(recursively?: boolean) {
		this.detachFromWorld();
		this.ref.removeEventListener("added", this.onAdded);
		this.ref.removeEventListener("removed", this.onRemoved);

		delete this.ref.userData.featurability;
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
		const object = this.ref as unknown as IFeaturable<
			CompatibleModules<TFeatureModules, TModules>
		>;
		const instance = new feature(props ? { ...props, object } : { object });
		beforeAttach && beforeAttach(instance);
		this._features.push(instance);
		instance._init();

		_event[Object3DFeaturabilityEvent.FEATURE_ADDED].feature = instance;
		this.dispatchEvent(_event[Object3DFeaturabilityEvent.FEATURE_ADDED]);

		return instance;
	}

	getFeatureList(): Object3DFeature<any>[] {
		return this._features;
	}

	getFeature<TFeatureType extends typeof Object3DFeature>(
		f: TFeatureType
	): InstanceType<TFeatureType> | null {
		return this._features.find(
			(feature) => feature.type === f.name
		) as InstanceType<TFeatureType> | null;
	}

	destroyFeature<TFeature extends Object3DFeature<any>>(feature: TFeature) {
		this._log(`destroyFeature...`, feature.constructor.name, feature.id);
		const foundAndRemoved = removeArrayItem(this._features, feature);
		if (foundAndRemoved) {
			feature.destroy();

			_event[Object3DFeaturabilityEvent.FEATURE_REMOVED].feature = feature;
			this.dispatchEvent(_event[Object3DFeaturabilityEvent.FEATURE_REMOVED]);
		}
	}

	/** @warning You should be careful to use this method manually. */
	_setWorld(world: GameContext<TModules> | null) {
		if (world) {
			this.attachToWorld(world);
		} else {
			this.detachFromWorld();
		}
	}

	protected onAdded = ({ target }: { target: THREE.Object3D }) => {
		this._log("onAdded...");
		const parent = target.parent;
		if (!parent) return;

		if (Object3DFeaturability.has<TModules>(parent)) {
			const parentFtblt = parent.userData.featurability;
			this._log("onAdded parent is featurable");
			parentFtblt._ctx && this.attachToWorldRecursively(parentFtblt._ctx);
			return;
		}
		this._log("onAdded parent is just object3d");
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы IFeaturable
		let featurableAncestor: IFeaturable<TModules> | null = null;
		traverseAncestorsInterruptible(target, (ancestor: THREE.Object3D) => {
			const isObjectFeaturable = Object3DFeaturability.has<TModules>(ancestor);
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
				this.attachToWorldRecursively(
					featurableAncestor.userData.featurability.ctx
				);
		}
	};

	private onRemoved = (_: THREE.Event<"removed", TObj>) => {
		this._log("onRemoved...");
		this.detachFromWorldRecursively();
	};

	private attachToWorld(world: GameContext<TModules>) {
		this._log("attachToWorld", "...");
		if (this._ctx !== null) {
			this._log("attachToWorld", "there is some world here");
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

	private detachFromWorld() {
		this._log("detachFromWorld...");
		if (this._ctx === null) return;

		_event[CtxAttachableEvent.DETACHED_FROM_CTX].ctx = this._ctx;
		this._ctx = null;
		this.dispatchEvent(_event[CtxAttachableEvent.DETACHED_FROM_CTX]);

		this._log("detachFromWorld done!");
	}

	private attachToWorldRecursively(world: GameContext<TModules>) {
		this._log("attachToWorldRecursively...");
		this.ref.traverse((child) => {
			Object3DFeaturability.has<TModules>(child) &&
				child.userData.featurability.attachToWorld(world);
		});
	}

	private detachFromWorldRecursively() {
		this._log("detachFromWorldRecursively...");
		this.ref.traverse((child) => {
			Object3DFeaturability.has(child) &&
				child.userData.featurability.detachFromWorld();
		});
	}

	private _log = (...args: any[]) => {
		console.log(`OF-${this.ref.id}-${this.ref.name}`, ...args);
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

const obj = Object3DFeaturability.new(THREE.Object3D);
obj.userData.featurability.addEventListener(
	CtxAttachableEvent.ATTACHED_TO_CTX,
	(event) => {
		event.ctx;
	}
);

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
