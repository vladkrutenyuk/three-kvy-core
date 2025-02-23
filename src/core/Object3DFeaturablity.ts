import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { removeArrayItem } from "../utils/remove-array-item";
import { traverseAncestorsInterruptible } from "../utils/traverse-ancestors-interruptible";
import { Evnt } from "./Events";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { Object3DFeature } from "./Object3DFeature";

export type Object3DFeaturabilityEventTypes<
	TModules extends GameContextModulesRecord = {}
> = {
	[Evnt.AttachedCtx]: [ctx: GameContext<TModules>];
	[Evnt.DetachedCtx]: [ctx: GameContext<TModules>];
	[Evnt.FeatureAdded]: [feature: Object3DFeature<TModules>];
	[Evnt.FeatureRemoved]: [feature: Object3DFeature<TModules>];
};

export class Object3DFeaturability<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
> extends EventEmitter<Object3DFeaturabilityEventTypes<TModules>> {
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
		return obj as unknown as IFeaturable<TModules, TObj>;
	}

	static from = <
		TModules extends GameContextModulesRecord = {},
		TObj extends THREE.Object3D = THREE.Object3D
	>(
		obj: TObj
	) => {
		let fblty = Object3DFeaturability.extract<TModules, TObj>(obj);
		if (fblty) {
			return fblty;
		}
		fblty = new Object3DFeaturability<TModules, typeof obj>(obj);
		fblty.inheritCtx();
		return fblty;
	};

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
		TReturn = Object3DFeaturability<TModules, InstanceType<T>>
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
	private _pair?: [object: IFeaturable<TModules, TObj>, featurability: this];
	public get pair(): [object: IFeaturable<TModules, TObj>, featurability: this] {
		if (!this._pair) {
			this._pair = [this.object, this];
		}
		return this._pair;
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
		instance._init_();

		this.emit(Evnt.FeatureAdded, instance as unknown as Object3DFeature<TModules>);
		return instance;
	}

	getFeature<TFeatureClass extends typeof Object3DFeature>(
		FeatureClass: TFeatureClass
	): InstanceType<TFeatureClass> | null {
		return (this._features.find((feature) => feature instanceof FeatureClass) ??
			null) as InstanceType<TFeatureClass> | null;
	}

	//TODO придумать что-то с типами
	getFeatureBy(
		predicate: (feature: Object3DFeature) => boolean
	): Object3DFeature | null {
		return this._features.find(predicate) ?? null;
	}

	destroyFeature<TFeature extends Object3DFeature<any>>(feature: TFeature) {
		this._log(`destroying feature...`);
		const foundAndRemoved = removeArrayItem(this._features, feature);
		if (foundAndRemoved) {
			feature.destroy();

			this.emit(Evnt.FeatureRemoved, feature);
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

	rename(name: string): this {
		this.object.name = name;
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

		if (Object3DFeaturability.isIn<TModules>(parent)) {
			const parentFtblt = parent.userData.featurability;
			this._log("onAdded parent is featurable");
			parentFtblt._ctx && this.propagateAttachCtxDown(parentFtblt._ctx);
			return;
		}
		this._log("onAdded parent is just object3d");
		// обрабатываем случай когда GameObject был добавлен к обычному Object3D

		// ищем предка который был бы IFeaturable
		let featurableAncestor: IFeaturable<TModules> | null = null;
		//TODO rewrite via stack (while)
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
				this.propagateAttachCtxDown(
					featurableAncestor.userData.featurability.ctx
				);
		}
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
		this.emit(Evnt.AttachedCtx, ctx);

		this._log("attached ctx");
	}

	private detachCtx() {
		this._log("detaching ctx...");
		if (this._ctx === null) return;

		const ctx = this._ctx;
		this._ctx = null;
		this.emit(Evnt.DetachedCtx, ctx);

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

export type IFeaturable<
	TModules extends GameContextModulesRecord = any,
	TObj extends THREE.Object3D = THREE.Object3D
> = TObj & {
	userData: {
		featurability: Object3DFeaturability<TModules, TObj>;
	};
};

type IFeaturableToDelete = {
	userData: Partial<IFeaturable["userData"]>;
};

// export type isSubsetRecord<
// 	TSub extends Record<TKey, TValue>,
// 	TRecord extends Record<TKey, TValue>,
// 	TKey extends string | number | symbol = string,
// 	TValue = any
// > = {
// 	[K in keyof TSub]: K extends keyof TRecord
// 		? TSub[K] extends TRecord[K]
// 			? never
// 			: K
// 		: K;
// }[keyof TSub];

// export type CompatibleFeature<
// 	TFeatureModules extends GameContextModulesRecord,
// 	TGameObjectModules extends GameContextModulesRecord
// > = isSubsetRecord<TFeatureModules, TGameObjectModules> extends never
// 	? Object3DFeature<TFeatureModules, any, any>
// 	: never;

// export type CompatibleModules<
// 	TSubModules extends GameContextModulesRecord,
// 	TModules extends GameContextModulesRecord
// > = isSubsetRecord<TSubModules, TModules> extends never ? TSubModules : never;

// addFeature<
// 		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
// 		TFeatureModules extends GameContextModulesRecord = {},
// 		TProps extends {} = {}
// 	>(
// 		Feature: new (
// 			p: Object3DFeatureProps<
// 				CompatibleModules<TFeatureModules, TFeatureModules>,
// 				TProps
// 			>
// 		) => TFeature,
// 		props: TProps,
// 		beforeAttach?: (feature: TFeature) => void
// 	): TFeature;

// 	addFeature<
// 		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
// 		TFeatureModules extends GameContextModulesRecord = {}
// 	>(
// 		Feature: new (
// 			p: Object3DFeatureProps<CompatibleModules<TFeatureModules, TModules>>
// 		) => TFeature,
// 		props?: undefined,
// 		beforeAttach?: (feature: TFeature) => void
// 	): TFeature;

// 	addFeature<
// 		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
// 		TFeatureModules extends GameContextModulesRecord = {}
// 	>(
// 		Feature: new (
// 			p: Object3DFeatureProps<CompatibleModules<TFeatureModules, TModules>>
// 		) => TFeature,
// 		props: unknown,
// 		beforeAttach?: (feature: TFeature) => void
// 	): TFeature
