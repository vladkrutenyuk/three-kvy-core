export * from "./utils/remove-array-item.js";
// export * from "./utils/dispose-object3d.js";
export * from "./utils/traverse-ancestors-interruptible.js";
export * from "./core/Events.js";
export * from "./core/AnimationFrameLoop.js";
export * from "./core/ThreeContext.js";
export * from "./core/Object3DFeature.js";
export * from "./core/GameContext.js";
export * from "./core/GameContextModule.js";
export * from "./core/Object3DFeaturablity.js";

export const REVISION = '11';

declare global {
	interface Window {
		__VLADKRUTENYUK_GAME_WORLD__?: string;
	}
}

if (typeof window !== "undefined") {
	if (window.__VLADKRUTENYUK_GAME_WORLD__) {
		console.warn(
			"WARNING: Multiple instances of `three-game-ctx/react-fiber` being imported."
		);
	} else {
		window.__VLADKRUTENYUK_GAME_WORLD__ = REVISION;
	}
}