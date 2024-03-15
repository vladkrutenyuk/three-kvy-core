import { GameContext, GameContextModulesRecord } from "./GameContext";

export enum CtxAttachableEvent {
	ATTACHED_TO_CTX = 'attachedtoctx',
	DETACHED_FROM_CTX = 'detachedfromctx'
}

export type CtxAttachableEventMap<TModules extends GameContextModulesRecord = {}> = {
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		ctx: GameContext<TModules>;
	};
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		ctx: GameContext<TModules>;
	};
};

