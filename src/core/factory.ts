import type * as THREE from "three";
import {
    IFeaturable,
    Object3DFeaturability
} from "./Object3DFeaturablity";
import { Object3DFeature } from "./Object3DFeature";

/**
 * Adds a new feature to the object.
 * @param Feature The feature class.
 * @param props The properties required for initialization.
 * @param beforeAttach A callback invoked before attaching the feature.
 * @returns The created feature instance.
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
 * Retrieves a feature of a specific class, if present.
 * @param FeatureClass The feature class to search for.
 * @returns The feature instance, or `null` if not found.
 */
export function getFeature<
	TObj extends THREE.Object3D,
	TFeatureClass extends typeof Object3DFeature
>(obj: TObj, FeatureClass: TFeatureClass): InstanceType<TFeatureClass> | null {
	return Object3DFeaturability.extract(obj)?.getFeature(FeatureClass) ?? null;
}

/**
 * Retrieves a feature of a specific class, if present.
 * @param FeatureClass The feature class to search for.
 * @returns The feature instance, or `null` if not found.
 */
export function getFeatureBy<TObj extends THREE.Object3D>(
	obj: TObj,
	predicate: (feature: Object3DFeature) => boolean
): Object3DFeature | null {
	return Object3DFeaturability.extract(obj)?.getFeatureBy(predicate) ?? null;
}

/**
 * Returns an array of all attached features.
 */
export function getFeatures<TObj extends THREE.Object3D>(
	obj: TObj
): Object3DFeature[] | null {
	return Object3DFeaturability.extract(obj)?.features ?? null;
}

/**
 * Removes a feature from the object and destroys it.
 * @param feature The feature instance to remove.
 */
export function destroyFeature<
	TObj extends THREE.Object3D,
	TFeature extends Object3DFeature<any>
>(obj: TObj, feature: TFeature) {
	Object3DFeaturability.extract(obj)?.destroyFeature(feature);
	return obj;
}

/**
 * Destroys and detachs anything about features and all attached to object features itself.
 * @param obj {THREE.Object3D}
 * @returns
 */
export function clear<TObj extends THREE.Object3D>(obj: TObj) {
	Object3DFeaturability.extract(obj)?.destroy();
	return obj;
}
