import { GameContext, GameContextModulesRecord } from "./GameContext";

export const CtxAttachableEvent = {
	ATTACHED_TO_CTX: "attachedtoctx",
	DETACHED_FROM_CTX: "detachedfromctx",
} as const;

export type CtxAttachableEventMap<TModules extends GameContextModulesRecord = {}> = {
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		ctx: GameContext<TModules>;
	};
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		ctx: GameContext<TModules>;
	};
};
