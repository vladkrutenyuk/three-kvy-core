export function removeArrayItem<T>(array: T[], item: T): void {
	const index = array.indexOf(item)
	if (index !== -1) {
		array.splice(index, 1)
	}
}
