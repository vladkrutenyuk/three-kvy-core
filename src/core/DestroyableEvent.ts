export const DestroyableEvent = {
	DESTROYED: "destroyed",
} as const;

export type DestroyableEventMap = {
	[DestroyableEvent.DESTROYED]: {};
};
