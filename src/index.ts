import { REVISION } from "./revision";
export * from "./core/AnimationFrameLoop";
export * from "./core/Object3DFeature";
export * from "./core/GameContext";
export * from "./core/GameContextModule";
export * from "./core/Object3DFeaturablity";
export * from "./core/ThreeContext";

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