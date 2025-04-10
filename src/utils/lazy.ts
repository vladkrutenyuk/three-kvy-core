export function lazy<T>(factory: () => T): () => T {
	let val: T | undefined;
	return () => val ??= factory();
}