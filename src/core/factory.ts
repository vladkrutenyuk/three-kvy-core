import type * as THREE from "three";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { Object3DFeature } from "./Object3DFeature";

/**
 * A static factory method that creates {@link Object3DFeature} and adds it to a given Three.js `Object3D` instance.
 * It uses a given feature class (not an instance) that extends {@link Object3DFeature}
 * with optional constructor parameters. Returns an instance of the provided feature class.
 * @param {THREE.Object3D} obj  - The target Three.js `Object3D` instance to which the feature is added.
 * @param {typeof Object3DFeature} Feature - The feature class to add, which extends {@link Object3DFeature}.
 * @param {object | undefined} props - An object containing parameters for the feature's constructor. Optional of feature implementation has no custom props in constructor.
 * @param {(feature: Object3DFeature) => void} [beforeAttach] - (optional) A callback invoked before attaching the feature
 * @returns {Object3DFeature} The created feature instance.
 */
export function addFeature<
	TObj extends THREE.Object3D,
	TFeature extends Object3DFeature<any, any>,
	TProps
>(
	obj: TObj,
	Feature: new (object: IFeaturable, props: TProps) => TFeature,
	props: keyof TProps extends never ? undefined : TProps,
	beforeAttach?: (feature: TFeature) => void
): TFeature;
export function addFeature<
	TObj extends THREE.Object3D,
	TFeature extends Object3DFeature<any, any>
>(
	obj: TObj,
	Feature: new (object: IFeaturable) => TFeature
): // props: keyof TProps extends never ? undefined : TProps
TFeature;
export function addFeature<
	TObj extends THREE.Object3D,
	TFeature extends Object3DFeature<any, any>,
	TProps
>(
	obj: TObj,
	Feature: new (object: IFeaturable, props?: TProps) => TFeature,
	props?: TProps,
	beforeAttach?: (feature: TFeature) => void
): TFeature {
	const f = Object3DFeaturability.from(obj);
	
	return f.addFeature(Feature, props as any, beforeAttach);
}

/**
 * A static method that retrieves a feature instance from the given object by its class (constructor). Returns first found such feature instance, or `null` if not.
 * @param {THREE.Object3D} obj - The target Three.js Object3D instance to search for the feature.
 * @param {typeof Object3DFeature} FeatureClass - The feature class (constructor) whose instance is being searched for. It must extends Object3DFeature.
 * @returns {Object3DFeature | null}
 */
export function getFeature<
	TObj extends THREE.Object3D,
	TFeatureClass extends typeof Object3DFeature
>(obj: TObj, FeatureClass: TFeatureClass): InstanceType<TFeatureClass> | null {
	return Object3DFeaturability.extract(obj)?.getFeature(FeatureClass) ?? null;
}

/**
 * Finds a feature in the given object using a predicate function. Returns the first matching instance of `Object3DFeature` if found, otherwise `null`.
 * @param {THREE.Object3D} obj - The target Three.js `Object3D` instance to search within.
 * @param {(feature: Object3DFeature) => boolean} predicate - A predicate function that receives a feature instance as an argument and returns a boolean indicating whether the feature matches.
 * @returns {Object3DFeature | null}
 */
export function getFeatureBy<TObj extends THREE.Object3D, TFeature extends Object3DFeature>(
	obj: TObj,
	predicate: (feature: TFeature) => boolean
): TFeature | null {
	return Object3DFeaturability.extract(obj)?.getFeatureBy<TFeature>(predicate) ?? null;
}

/**
 * Retrieves all features attached to a given object. Returns a copy of the feature list—an array of `Object3DFeature[]` instances—or `null` if no features were added.
 * @remarks Note that changing returned array won't affect anything. It returns a **COPY** of this object features list.
 * @param {THREE.Object3D} obj - The target Three.js `Object3D` instance.
 * @returns {Object3DFeature[] | null}
 */
export function getFeatures<TObj extends THREE.Object3D>(
	obj: TObj
): Object3DFeature[] | null {
	return Object3DFeaturability.extract(obj)?.features ?? null;
}

/**
 * Destroys and detaches all features from the given object, freeing associated resources. 
 * If `recursively` is set to `true`, this method will apply cleanup recursively to the entire object hierarchy.
 * @param {THREE.Object3D} obj - The target Three.js `Object3D` instance.
 * @param {boolean} recursively  - (Optional) Default is `false`. A boolean flag indicating whether to apply this method recursively to the object's hierarchy.
 */
export function clear<TObj extends THREE.Object3D>(obj: TObj, recursively?: boolean) {
	if (recursively) obj.traverse(Object3DFeaturability.destroy);
	else Object3DFeaturability.destroy(obj);
}

//TODO addFeatures(obj, [class MyFeature, { value: 2}], [class AnotherFeature], ... ): [MyFeature, AnotherFeature]