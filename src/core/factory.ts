import type * as THREE from "three";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { Object3DFeature } from "./Object3DFeature";
import { IFeaturableRoot } from "./GameContext";

/**
 * Adds a new feature to the object.
 * @param {THREE.Object3D} obj - The Three.js object to add the feature to
 * @param {new (object: IFeaturable, props?: any) => Object3DFeature} Feature - The feature class constructor
 * @param {*} [props] - The properties required for feature initialization
 * @param {(feature: Object3DFeature) => void} [beforeAttach] - Optional callback invoked before attaching the feature
 * @returns {Object3DFeature} The created feature instance
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
 * Retrieves a feature instance of a specific class from the object.
 * @param {THREE.Object3D} obj - The Three.js object to search on
 * @param {typeof Object3DFeature} FeatureClass - The class of the feature to find
 * @returns {Object3DFeature | null} The feature instance if found, or `null` if not present
 */
export function getFeature<
	TObj extends THREE.Object3D,
	TFeatureClass extends typeof Object3DFeature
>(obj: TObj, FeatureClass: TFeatureClass): InstanceType<TFeatureClass> | null {
	return Object3DFeaturability.extract(obj)?.getFeature(FeatureClass) ?? null;
}

/**
 * Finds a feature on the object that matches the given predicate.
 * @param {THREE.Object3D} obj - The Three.js object to search on
 * @param {(feature: Object3DFeature) => boolean} predicate - Function that tests each feature for a condition
 * @returns {Object3DFeature | null} The first matching feature if found, or `null` if none match
 */
export function getFeatureBy<TObj extends THREE.Object3D>(
	obj: TObj,
	predicate: (feature: Object3DFeature) => boolean
): Object3DFeature | null {
	return Object3DFeaturability.extract(obj)?.getFeatureBy(predicate) ?? null;
}

/**
 * Returns an array of all features attached to the object.
 * @param {THREE.Object3D} obj - The Three.js object to get features from
 * @returns {Object3DFeature[] | null} Array of attached features, or `null` if the object has no featurability
 */
export function getFeatures<TObj extends THREE.Object3D>(
	obj: TObj
): Object3DFeature[] | null {
	return Object3DFeaturability.extract(obj)?.features ?? null;
}

/**
 * Destroys and detaches all features from the given object, cleaning up any associated resources.
 * This removes the featurability aspect from the object and cleans up all feature instances.
 * @param {THREE.Object3D} obj - The Three.js object to clear features from
 * @param {boolean} recursively
 * @returns {THREE.Object3D} The original object after clearing all features
 */
export function clear<TObj extends THREE.Object3D>(obj: TObj, recursively?: boolean) {
	if (recursively) obj.traverse(Object3DFeaturability.destroy);
	else Object3DFeaturability.destroy(obj);
	return obj;
}