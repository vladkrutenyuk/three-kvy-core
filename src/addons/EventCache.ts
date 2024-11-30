// import * as THREE from "three";

type EventTypeMap = {
	[key: string]: { [dataKey: string]: any };
};

type EventCachePayload<T> = {
	[K in keyof T]: T[K];
};

export type EventCacheMapInfer<T extends EventCache<any>> = T["payload"];

export class EventCache<T extends EventTypeMap> {
	readonly payload: EventCachePayload<T>;

	readonly events: {
		[K in keyof T]: Callable<T[K] & { type: K }>;
	};

	constructor(payload: EventCachePayload<T>) {
		const descriptor = payload as { [K in keyof T]: T[K] & { type: K, target: any } };
		this.events = {} as any;
		for (const key in descriptor) {
			const event = descriptor[key];
			event["type"] = key;
			event["target"] = null;
			this.events[key] = objToProxyKeyValueChangeCurrying(event);
		}
		this.payload = payload;
	}

	use<TType extends keyof T>(type: TType) {
		return this.events[type];
	}
}

type Callable<TObj> = {
	<TKey extends keyof Omit<TObj, "type">, TValue extends TObj[TKey]>(
		key: TKey,
		value: TValue
	): Callable<TObj>;
} & TObj;

function objToProxyKeyValueChangeCurrying<T extends object>(obj: T): Callable<T> {
	const proxy = new Proxy(() => {}, {
		apply(target, thisArg, args) {
			const [key, value] = args;
			obj[key] = value;
			return proxy;
		},
		get(target, key) {
			return key in obj ? obj[key] : target[key];
		},
		set(target, key, value) {
			if (!(key in obj)) return false;
			obj[key] = value;
			return true;
		},
	});
	return proxy as Callable<T>;
}


// const cache = new EventCache({ moved: { x: 0, y: 0 }, destroyed: {} });
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// type CarEventMap = EventCacheMapInfer<typeof cache>;
// class Car extends THREE.EventDispatcher<CarEventMap> {
// 	moved(x: number, y: number) {
// 		this.dispatchEvent(cache.use("moved")("x", x)("y", y));
// 	}
// 	destroy() {
// 		this.dispatchEvent(cache.use("destroyed"));
// 	}
// }

// new Car().moved(2, 3);