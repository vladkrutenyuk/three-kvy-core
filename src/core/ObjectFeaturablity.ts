import * as THREE from "three";
import { CompatibleFeature, CompatibleModules } from "./_stash/GameObject";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { Feature, FeatureProps } from "./Feature";
import { removeArrayItem } from "../utils/general/remove-array-item";
import { traverseAncestorsInterruptible } from "../utils/three/traverse-ancestors-interruptible";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";

export class ObjectFeaturability<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
> extends THREE.EventDispatcher<CtxAttachableEventMap<TModules>> {
	public readonly isObjectFeaturability = true;
	public readonly ref: TObj;

	public get world() {
		return this._world;
	}

	protected _world: GameContext<TModules> | null = null;
	private readonly _features: Feature<any>[] = [];

	/** it works recursively */
	static wrap<
		TObj extends THREE.Object3D = THREE.Object3D,
		TModules extends GameContextModulesRecord = {}
	>(obj: TObj): IFeaturable<TModules, TObj> {
		obj.traverse((child) => {
			const featurable = child as IFeaturable;
			featurable.userData.featurability = new ObjectFeaturability(child);
		});
		return obj as IFeaturable<TModules, TObj>;
	}

	static has<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj): obj is IFeaturable<TModules, TObj> {
		const _f = (obj as IFeaturable<TModules, TObj>).userData.featurability;
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
		this.ref.addEventListener("added", this.onAdded);
		this.ref.addEventListener("removed", this.onRemoved);
	}

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {},
		TProps extends {} = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TFeatureModules>, TProps>
		) => TFeature,
		props: TProps
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props?: undefined
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends GameContextModulesRecord = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props: unknown
	): TFeature {
		const object = this.ref as unknown as IFeaturable<
			CompatibleModules<TFeatureModules, TModules>
			// ,TEventMap
		>;
		const instance = new feature(props ? { ...props, object } : { object });
		this._features.push(instance);
		instance.init();
		return instance;
	}

	getFeature<TFeatureType extends typeof Feature>(
		f: TFeatureType
	): InstanceType<TFeatureType> | null {
		return this._features.find(
			(feature) => feature.type === f.name
		) as InstanceType<TFeatureType> | null;
	}

	destroyFeature<TFeature extends Feature<any>>(feature: TFeature) {
		this._log(`destroyFeature...`, feature.constructor.name, feature.id);
		const foundAndRemoved = removeArrayItem(this._features, feature);
		if (foundAndRemoved) {
			feature.destroy();
		}
	}

	/** @description You should be careful to use this method manually. */
	setWorld(world: typeof this.world) {
		if (world) {
			this.attachToWorld(world);
		} else {
			this.detachFromWorld();
		}
	}

	protected onAdded = ({ target }: THREE.Event<"added", typeof this.ref>) => {
		this._log("onAdded...");
		const parent = target.parent;
		if (parent && ObjectFeaturability.has<TModules>(parent)) {
			const parentFtblt = parent.userData.featurability;
			this._log("onAdded parent is featurable");
			parentFtblt._world && this.attachToWorldRecursively(parentFtblt._world);
			return;
		}
		this._log("onAdded parent is just object3d");
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы IFeaturable
		let featurableAncestor: IFeaturable<TModules> | null = null;
		traverseAncestorsInterruptible(target, (ancestor: THREE.Object3D) => {
			const isObjectFeaturable = ObjectFeaturability.has<TModules>(ancestor);
			if (isObjectFeaturable) {
				featurableAncestor = ancestor;
			}
			return !isObjectFeaturable;
		});
		featurableAncestor = featurableAncestor as IFeaturable<TModules> | null;

		// если нашли и если у него есть мир то аттачимся к нему
		if (featurableAncestor !== null) {
			this._log("onAdded found game object ancestor");
			featurableAncestor.userData.featurability.world &&
				this.attachToWorldRecursively(
					featurableAncestor.userData.featurability.world
				);
		}
	};

	private onRemoved = (_: THREE.Event<"removed", typeof this.ref>) => {
		this._log("onRemoved...");
		this.detachFromWorldRecursively();
	};

	private attachToWorld(world: GameContext<TModules>) {
		this._log("attachToWorld", "...");
		if (this._world !== null) {
			this._log("attachToWorld", "there is some world here");
			if (this._world !== world) {
				console.error(
					"Cannot attach this object. It had attached to another world."
				);
				return;
			}
			this._log("attachToWorld: this world has already been attached here");
			return;
		}

		this._world = world;
		_event[CtxAttachableEvent.ATTACHED_TO_CTX].ctx = this._world;
		this.dispatchEvent(_event[CtxAttachableEvent.ATTACHED_TO_CTX]);

		this._log("attachToWorld done!");
	}

	private detachFromWorld() {
		this._log("detachFromWorld...");
		if (this._world === null) return;

		_event[CtxAttachableEvent.DETACHED_FROM_CTX].ctx = this._world;
		this._world = null;
		this.dispatchEvent(_event[CtxAttachableEvent.DETACHED_FROM_CTX]);

		this._log("detachFromWorld done!");
	}

	private attachToWorldRecursively(world: GameContext<TModules>) {
		this._log("attachToWorldRecursively...");
		this.ref.traverse((child) => {
			ObjectFeaturability.has<TModules>(child) &&
				child.userData.featurability.attachToWorld(world);
		});
	}

	private detachFromWorldRecursively() {
		this._log("detachFromWorldRecursively...");
		this.ref.traverse((child) => {
			ObjectFeaturability.has(child) &&
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
		featurability: ObjectFeaturability<TModules, TObj>;
	};
};

const _event: {
	[K in keyof CtxAttachableEventMap<any>]: {
		type: K;
	} & CtxAttachableEventMap<any>[K];
} = {
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		type: CtxAttachableEvent.ATTACHED_TO_CTX,
		ctx: {} as any,
	},
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		type: CtxAttachableEvent.DETACHED_FROM_CTX,
		ctx: {} as any,
	},
};

const obj = ObjectFeaturability.new(THREE.Object3D)
obj.userData.featurability.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, (event) => {
	event.ctx
})
