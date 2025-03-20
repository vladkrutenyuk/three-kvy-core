export * from "./utils/remove-array-item.js";
// export * from "./utils/dispose-object3d.js";
export * from "./utils/traverse-up.js";
export * from "./core/ThreeContext.js";
export * from "./core/Object3DFeature.js";
export * from "./core/CoreContext.js";
export * from "./core/CoreContextModule.js";
export * from "./core/Object3DFeaturablity.js";
export * from "./core/factory.js";

export const REVISION = '2.0.0-gamma.5';

declare global {
	interface Window {
		__THREE_KVY_CORE__?: string;
	}
}

const key = "__THREE_KVY_CORE__";
if (typeof window !== "undefined") {
	if (window[key]) {
		console.warn(
			"WARNING: Multiple instances of `@vladkrutenyuk/three-kvy-core` being imported."
		);
	} else {
		window[key] = REVISION;
	}
}