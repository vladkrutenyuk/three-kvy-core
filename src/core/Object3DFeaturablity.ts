import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { removeArrayItem } from "../utils/remove-array-item";
import { traverseUp } from "../utils/traverse-up";
import { Evnt } from "./Events";
import { GameContext, GameContextModulesRecord, IFeaturableRoot } from "./GameContext";
import { Object3DFeature } from "./Object3DFeature";
import { defineProps, notEnumer } from "../utils/define-props";

export type Object3DFeaturabilityEventTypes<
	TModules extends GameContextModulesRecord = {}
> = {
	[Evnt.AttCtx]: [ctx: GameContext<TModules>];
	[Evnt.DetCtx]: [ctx: GameContext<TModules>];
	[Evnt.FtAdd]: [feature: Object3DFeature<TModules>];
	[Evnt.FtRem]: [feature: Object3DFeature<TModules>];
};

const key = "__kvy_ftblty__";

export class Object3DFeaturability<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
> extends EventEmitter<Object3DFeaturabilityEventTypes<TModules>> {
	/**
	 * Extracts {@link Object3DFeaturability} from the given object if it is featurable.
	 *
	 * @param obj - The object to extract {@link Object3DFeaturability} from.
	 * @returns The {@link Object3DFeaturability} instance if available, otherwise `null`.
	 */
	static extract<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj): Object3DFeaturability<TModules, TObj> | null {
		const f = (obj as TObj & IFeaturablePrivate<TModules, TObj>)[key];
		return f !== undefined && f.isObjectFeaturability ? f : null;
	}

	/**
	 * Creates or retrieves {@link Object3DFeaturability} for the given object.
	 * If the object already has featurability, it is returned. Otherwise, a new instance is created.
	 *
	 * @param obj - The object to make featurable.
	 * @returns The {@link Object3DFeaturability} instance for the object.
	 */
	static from<
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(obj: TObj) {
		let fblty = Object3DFeaturability.extract<TModules, TObj>(obj);
		if (fblty) {
			return fblty;
		}
		fblty = new Object3DFeaturability<TModules, typeof obj>(obj);
		// fblty.inheritCtx();
		return fblty;
	}

	static destroy<TObj extends THREE.Object3D = THREE.Object3D>(obj: TObj, force?: boolean): void {
		Object3DFeaturability.extract(obj)?.destroy(force);
	}

	/**
	 * Custom logging function.
	 */
	static log: (target: Object3DFeaturability, msg: string) => void = () => {};

	public readonly isObjectFeaturability = true;

	/**
	 * The wrapped `Object3D` instance.
	 */
	public readonly object: IFeaturablePrivate<TModules, TObj>;

	/**
	 * Returns the associated `GameContext`, if any.
	 */
	public get ctx() {
		return this._ctx;
	}

	/**
	 * Returns copied array of all attached features.
	 */
	public get features() {
		return [...this._features];
	}

	private _ctx: GameContext<TModules> | null = null;
	private readonly _features: Object3DFeature<any>[] = [];

	/**
	 * Creates a new `Object3DFeaturability` instance for the given `Object3D`.
	 * @param obj The `Object3D` instance to wrap.
	 */
	private constructor(obj: TObj) {
		super();
		this.object = obj as IFeaturable<TModules, TObj>;
		obj.addEventListener("added", this.onObjectAdded);
		obj.addEventListener("removed", this.onObjectRemoved);

		defineProps(obj, {
			[key]: notEnumer(this),
			isFeaturable: notEnumer(true),
		});

		if (obj.parent) {
			this.onObjectAdded({ target: obj });
		}

		this.inheritCtx();
	}

	/**
	 * Destroys the featurability instance and removes all features.
	 */
	destroy(force?: boolean) {
		this.destroyAllFeatures();

		if ((this.object as typeof this.object & IFeaturableRoot).isRoot && !force) {
			return;
		}

		this.detachCtx();
		const obj = this.object;
		obj.removeEventListener("added", this.onObjectAdded);
		obj.removeEventListener("removed", this.onObjectRemoved);

		delete obj[key];
		delete obj.isFeaturable;

		//TODO remove all listeners from all
	}

	destroyAllFeatures() {
		const features = this.features;
		for (const feature of features) {
			feature.destroy();
		}
	}

	/**
	 * Adds a new feature to the object.
	 * @param Feature The feature class.
	 * @param props The properties required for initialization.
	 * @param beforeAttach A callback invoked before attaching the feature.
	 * @returns The created feature instance.
	 */
	addFeature<TFeature extends Object3DFeature<any, any>, TProps>(
		Feature: new (object: IFeaturable, props: TProps) => TFeature,
		props: keyof TProps extends never ? undefined : TProps,
		beforeAttach?: (feature: TFeature) => void
	): TFeature;
	addFeature<TFeature extends Object3DFeature<any, any>>(
		Feature: new (object: IFeaturable) => TFeature
	): // props: keyof TProps extends never ? undefined : TProps
	TFeature;
	addFeature<TFeature extends Object3DFeature<any, any>, TProps>(
		Feature: new (object: IFeaturable, props?: TProps) => TFeature,
		props?: TProps,
		beforeAttach?: (feature: TFeature) => void
	): TFeature {
		const instance = new Feature(
			this.object as IFeaturable<any, any>,
			props ?? ({} as any)
		);
		beforeAttach?.(instance);

		this._features.push(instance);
		instance.init();

		this.emit(Evnt.FtAdd, instance as unknown as Object3DFeature<TModules>);
		return instance;
	}

	/**
	 * Retrieves a feature of a specific class, if present.
	 * @param FeatureClass The feature class to search for.
	 * @returns The feature instance, or `null` if not found.
	 */
	getFeature<TFeatureClass extends typeof Object3DFeature>(
		FeatureClass: TFeatureClass
	): InstanceType<TFeatureClass> | null {
		return (this._features.find((feature) => feature instanceof FeatureClass) ??
			null) as InstanceType<TFeatureClass> | null;
	}

	//TODO придумать что-то с типами
	/**
	 * Retrieves a feature of a specific class, if present.
	 * @param FeatureClass The feature class to search for.
	 * @returns The feature instance, or `null` if not found.
	 */
	getFeatureBy(
		predicate: (feature: Object3DFeature) => boolean
	): Object3DFeature | null {
		return this._features.find(predicate) ?? null;
	}

	/**
	 * Removes a feature from the object and destroys it.
	 * @param feature The feature instance to remove.
	 */
	destroyFeature<TFeature extends Object3DFeature<any, any>>(feature: TFeature) {
		this._log(`destroying feature...`);
		const foundAndRemoved = removeArrayItem(this._features, feature);
		if (foundAndRemoved) {
			feature.destroy();

			this.emit(Evnt.FtRem, feature);
			return true;
		}
		return false;
	}

	/**
	 * Attaches or detaches the object from a `GameContext`.
	 * @warning You should be careful to use this method manually
	 * @param ctx The `GameContext` instance, or `null` to detach.
	 * @returns This instance.
	 * @warning Use with caution.
	 */
	setCtx(ctx: GameContext<TModules> | null) {
		if (ctx) {
			this.attachCtx(ctx);
		} else {
			this.detachCtx();
		}
		return this;
	}

	private onObjectAdded({ target }: { target: THREE.Object3D }) {
		const self = Object3DFeaturability.extract(target);
		if (!self) {
			console.error("Object3DFeaturability is not in target object.");
			return;
		}
		self._log("object added");
		self.inheritCtx();
	}

	private inheritCtx() {
		const target = this.object;
		const parent = target.parent;
		if (!parent) return;

		const parentCtx = Object3DFeaturability.extract<TModules>(parent)?._ctx;
		if (parentCtx) {
			this._log("onAdded parent has ctx");
			this.propagateAttachCtxDown(parentCtx);
			return;
		}
		this._log("onAdded parent is just object3d");
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы IFeaturable
		let ancestorF: Object3DFeaturability<TModules> | null = null;
		//TODO rewrite via stack (while)
		traverseUp(target, (ancestor: THREE.Object3D) => {
			ancestorF = Object3DFeaturability.extract<TModules>(ancestor);
			return !ancestorF;
		});

		if (ancestorF === null) return;

		// если нашли и если у него есть мир то аттачимся к нему
		const ancestorCtx = (ancestorF as Object3DFeaturability<TModules>).ctx;
		this._log("onAdded found featurable object ancestor");
		ancestorCtx && this.propagateAttachCtxDown(ancestorCtx);
	}

	private onObjectRemoved({ target }: { target: THREE.Object3D }) {
		const self = Object3DFeaturability.extract(target);
		if (!self) {
			console.error("Object3DFeaturability is not in target object.");
			return;
		}

		self._log("object removed");
		self.propagateDetachCtxDown();
	}

	private attachCtx(ctx: GameContext<TModules>) {
		this._log("attaching ctx...");
		if (this._ctx !== null) {
			this._log("there is some ctx here");
			if (this._ctx !== ctx) {
				console.error(
					"Cannot attach this object. It had attached to another ctx."
				);
				return;
			}
			this._log("had attached already");
			return;
		}

		this._ctx = ctx;
		this.emit(Evnt.AttCtx, ctx);

		ctx.once(Evnt.Dstr, this.detachCtx, this);

		this._log("attached ctx");
	}

	private detachCtx() {
		this._log("detaching ctx...");
		if (this._ctx === null) return;

		const ctx = this._ctx;
		this._ctx = null;
		this.emit(Evnt.DetCtx, ctx);

		ctx.off(Evnt.Dstr, this.detachCtx, this);

		this._log("detached ctx");
	}

	private propagateAttachCtxDown(ctx: GameContext<TModules>) {
		this._log("attaching ctx recursively...");
		this.object.traverse((child) => {
			Object3DFeaturability.extract(child)?.attachCtx(ctx);
		});
		//? shall I use stack instead of recursive traverse?
		// const stack: THREE.Object3D[] = [this.object];
		// while (stack.length > 0) {
		// 	const current = stack.pop();
		// 	if (current) {
		// 		Object3DFeaturability.extract(current)?.attachCtx(ctx);
		// 		stack.push(...current.children);
		// 	}
	}

	private propagateDetachCtxDown() {
		this._log("detaching ctx recursively...");
		this.object.traverse((child) => {
			Object3DFeaturability.extract(child)?.detachCtx();
		});
		//? shall I use stack instead of recursive traverse?
		// const stack: THREE.Object3D[] = [this.object];
		// while (stack.length > 0) {
		// 	const current = stack.pop();
		// 	if (current) {
		// 		Object3DFeaturability.extract(current)?.detachCtx();
		// 		stack.push(...current.children);
		// 	}
		// }
	}

	private _log(msg: string) {
		Object3DFeaturability.log(this as unknown as Object3DFeaturability, msg);
		// console.log(`OF-${this.ref.id}-${this.ref.name}`, ...args);
	}
}


/**
 * Represents an object that supports features.
 */
export type IFeaturable<
	TModules extends GameContextModulesRecord = any,
	TObj extends THREE.Object3D = THREE.Object3D
> = TObj & {
	isFeaturable: true;
};

type IFeaturablePrivate<
	TModules extends GameContextModulesRecord = any,
	TObj extends THREE.Object3D = THREE.Object3D
> = TObj & {
	[key]?: Object3DFeaturability<TModules, TObj>;
	isFeaturable?: true;
};
