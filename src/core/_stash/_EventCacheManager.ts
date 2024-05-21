import { GameContext } from "../GameContext";
import { CtxAttachableEventMap } from "../CtxAttachableEvent";

type EventTypeMap = {
	[key: string]: { [dataKey: string]: any };
};

type EventDescriptor<T> = {
	[K in keyof T]: {
		type: K;
	} & T[K];
};

type EventManagerPayload<T> = {
	[K in keyof T]: T[K];

};
function createEventCachedData<T extends EventTypeMap>(payload: EventManagerPayload<T>) {
    const descriptor = payload as EventDescriptor<T>
    for (const key in descriptor) {
        descriptor[key as keyof typeof descriptor]['type'] = key
    }
	function updateEvent<
		K extends keyof T,
		D extends keyof Omit<T[K], "type">,
		V extends T[K][D]
	>(type: K, dataKey: D, value: V) {
		// @ts-ignore because we are sure that its safe
		descriptor[type][dataKey] = value;
		return descriptor[type];
	}

	function getEvent<K extends keyof T>(type: K) {
		return descriptor[type];
	}

	return { updateEvent, getEvent };
}

type MyEventMap = {
	assholeChanged: {
		radius: number;
		owner: string;
	};
	penisDestroyed: {
		length: number;
	};
};

const eventCashedData = createEventCachedData<MyEventMap>({
	assholeChanged: { owner: "", radius: 2 },
	penisDestroyed: { length: 2 },
});
eventCashedData.updateEvent('assholeChanged', 'owner', 'sdf')
eventCashedData.updateEvent('assholeChanged', 'owner', 'sdf')
eventCashedData.getEvent('assholeChanged')

// const gameWorld = {} as GameWorld;

// // Обновляем событие, типы данныхKey и value выводятся автоматически
// eventManager.updateEvent("worlddetached", "world", gameWorld);

// // Получаем обновлённое событие
// const event = eventManager.getEvent("worldattached");
// console.log(event);
