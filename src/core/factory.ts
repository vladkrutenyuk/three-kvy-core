import type * as THREE from "three";
import { GameContextModulesRecord } from "./GameContext";
import {
	IFeaturable,
	IFeaturablePrivate,
	Object3DFeaturability,
} from "./Object3DFeaturablity";

/**
 * Extracts {@link Object3DFeaturability} from the given object if it is featurable.
 *
 * @param obj - The object to extract {@link Object3DFeaturability} from.
 * @returns The {@link Object3DFeaturability} instance if available, otherwise `null`.
 */
export function extract<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
>(obj: TObj): Object3DFeaturability<TModules, TObj> | null {
	const f = (obj as unknown as IFeaturablePrivate<TModules, TObj>).__kvy_ftblty__;
	return f !== undefined && f.isObjectFeaturability ? f : null;
}

/**
 * Creates or retrieves {@link Object3DFeaturability} for the given object.
 * If the object already has featurability, it is returned. Otherwise, a new instance is created.
 *
 * @param obj - The object to make featurable.
 * @returns The {@link Object3DFeaturability} instance for the object.
 */
export function from<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
>(obj: TObj) {
	let fblty = extract<TModules, TObj>(obj);
	if (fblty) {
		return fblty;
	}
	fblty = new Object3DFeaturability<TModules, typeof obj>(obj);
	// fblty.inheritCtx();
	return fblty;
}

/**
 * Wraps the object with {@link Object3DFeaturability}, making it featurable.
 * If applied recursively, all child objects will also be made featurable.
 *
 * @param obj - The object to wrap.
 * @param recursively - If `true`, applies featurability recursively to child objects.
 * @returns The object cast as {@link IFeaturable}.
 */
export function wrap<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
>(obj: TObj, recursively: boolean = false): IFeaturable<TModules, TObj> {
	if (recursively) {
		obj.traverse(from);
	} else {
		from(obj);
	}
	return obj as unknown as IFeaturable<TModules, TObj>;
}

/**
 * Checks if the object is featurable.
 *
 * @param obj - The object to check.
 * @returns `true` if the object has {@link Object3DFeaturability}, otherwise `false`.
 */
export function isIn<
	TModules extends GameContextModulesRecord = {},
	TObj extends THREE.Object3D = THREE.Object3D
>(obj: TObj): obj is IFeaturable<TModules, TObj> {
	const f = (obj as unknown as IFeaturablePrivate).__kvy_ftblty__;
	return f !== undefined && f.isObjectFeaturability;
}
