/**
 * Removes the first occurrence of a specified item from an array.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} array - The array from which to remove the item.
 * @param {T} item - The item to remove from the array.
 * @returns {boolean} - Returns `true` if the item was found and removed, otherwise `false`.
 */
export function removeArrayItem<T>(array: T[], item: T): boolean {
	const index = array.indexOf(item);
	const found = index !== -1;
	if (found) {
		array.splice(index, 1);
	}
	return found;
}
