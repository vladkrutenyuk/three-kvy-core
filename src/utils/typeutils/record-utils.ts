export type RoRecStr<TValue = any> = Readonly<Record<string, TValue>>;

export type isSubsetRecord<
	TSub extends Record<TKey, TValue>,
	TRecord extends Record<TKey, TValue>,
	TKey extends string | number | symbol = string,
	TValue = any
> = {
	[K in keyof TSub]: K extends keyof TRecord
		? TSub[K] extends TRecord[K]
			? never
			: K
		: K;
}[keyof TSub];