import * as THREE from "three";
const original = THREE.EventDispatcher.prototype.addEventListener;


export class EventDispatcher2<TEventMap extends {} = {}> {
	private _ls: any;

	/**
	 * Creates {@link EventDispatcher2 EventDispatcher2} object.
	 */
	constructor() {}

	/**
	 * Adds a listener to an event type.
	 * @param type The type of event to listen to.
	 * @param listener The function that gets called when the event is fired.
	 * @returns listener
	 */
	on<
		TType extends Extract<keyof TEventMap, string>,
		TListener extends THREE.EventListener<TEventMap[TType], TType, this>
	>(type: TType, listener: TListener): TListener;
	on<TType extends string, TListener extends THREE.EventListener<{}, TType, this>>(
		type: TType,
		listener: TListener
	): TListener {
		if (this._ls === undefined) this._ls = {};

		const listeners = this._ls;

		if (listeners[type] === undefined) {
			listeners[type] = [];
		}

		if (listeners[type].indexOf(listener) === -1) {
			listeners[type].push(listener);
		}
		return listener;
	}

	/** for compatibility with logic based on {@link THREE.EventDispatcher | THREE.EventDispatcher} */
	get addEventListener() {
		return this.on;
	}

	has(type, listener) {
		if (this._ls === undefined) return false;

		const listeners = this._ls;

		return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	}

	/** for compatibility with logic based on {@link THREE.EventDispatcher | THREE.EventDispatcher} */
	get hasEventListener() {
		return this.has;
	}

	off(type, listener) {
		if (this._ls === undefined) return;

		const listeners = this._ls;
		const listenerArray = listeners[type];

		if (listenerArray !== undefined) {
			const index = listenerArray.indexOf(listener);

			if (index !== -1) {
				listenerArray.splice(index, 1);
			}
		}
	}

	/**
	 * Fire an event type.
	 * @param event The event that gets fired.
	 */
	dispatchEvent<T extends Extract<keyof TEventMap, string>>(
		event: BaseEvent<T> & TEventMap[T],
		makeListenersCopy: boolean = true,
        
	): void {
		if (this._ls === undefined) return;

		const listeners = this._ls;
		const listenerArray = listeners[event.type];

		if (listenerArray === undefined) return;
		(event as any).target = this;

		// Make a copy, in case listeners are removed while iterating. Depends on the makeListenersCopy flag.
		const array = makeListenersCopy ? listenerArray.slice(0) : listenerArray;

		for (let i = 0, l = array.length; i < l; i++) {
			array[i].call(this, event);
		}

		(event as any).target = null;
	}

	invoke<T extends Extract<keyof TEventMap, string>>(type: T, ...args: any[]) {
		if (this._ls === undefined) return;

		const listeners = this._ls;
		const listenerArray = listeners[type];

		if (listenerArray === undefined) return;

		const array = listenerArray.slice(0);

		for (let i = 0, l = array.length; i < l; i++) {
			// ctx/target, ...args
			array[i].call(this, this, ...args);
		}
	}
}

class EventEmitterus<TEventMap extends Record<string, any[]> = {}> {
	private _ls: any;

	on<
		TType extends Extract<keyof TEventMap, string>,
		TListener extends THREE.EventListener<TEventMap[TType], TType, this>
	>(type: TType, listener: TListener): TListener;
	on<TType extends string, TListener extends THREE.EventListener<{}, TType, this>>(
		type: TType,
		listener: TListener
	): TListener {
		if (this._ls === undefined) this._ls = {};

		const listeners = this._ls;

		if (listeners[type] === undefined) {
			listeners[type] = [];
		}

		if (listeners[type].indexOf(listener) === -1) {
			listeners[type].push(listener);
		}
		return listener;
	}

	invoke<TType extends Extract<keyof TEventMap, string>>(
		type: TType,
		...args: TEventMap[TType]
	) {}

    subscr<TType extends Extract<keyof TEventMap, string>, TListener extends (target: this, ...args: TEventMap[TType]) => void>(
		type: TType,
		listener: TListener
	): TListener {
        if (this._ls === undefined) this._ls = {};

		const listeners = this._ls;

		if (listeners[type] === undefined) {
			listeners[type] = [];
		}

		if (listeners[type].indexOf(listener) === -1) {
			listeners[type].push(listener);
		}
		return listener;
    }
}

class Car extends EventEmitterus<{
	jumped: [height: number];
	moved: [x: number, y: number];
	destroyed: [];
}> {

};
const e = new Car();
e.invoke("moved", 2, 4);
e.invoke("destroyed");
e.subscr("jumped", (target, height) => {

})

e.subscr("moved", (target, x, y) => {
    
})

/**
 * The minimal basic Event that can be dispatched by a {@link EventDispatcher<>}.
 */
export interface BaseEvent<TEventType extends string = string> {
	readonly type: TEventType;
}

/**
 * The minimal expected contract of a fired Event that was dispatched by a {@link EventDispatcher<>}.
 */
export interface Event<TEventType extends string = string, TTarget = unknown> {
	readonly type: TEventType;
	readonly target: TTarget;
}

export type EventListener<TEventData, TEventType extends string, TTarget> = (
	event: TEventData & Event<TEventType, TTarget>
) => void;
