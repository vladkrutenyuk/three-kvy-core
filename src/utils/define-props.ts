export const defineProps = Object.defineProperties;

export const readOnly = (value: any): PropertyDescriptor => ({
	value,
	writable: false,
	configurable: false,
});
export const notEnumer = (value: any): PropertyDescriptor => ({
	value,
	enumerable: false,
	configurable: true,
});
