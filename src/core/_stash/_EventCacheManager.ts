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


function createEventManager<T extends EventTypeMap>(descriptor: EventDescriptor<T>) {
    function updateEvent<
        K extends keyof T,
        D extends keyof Omit<T[K], 'type'>,
        V extends T[K][D]
    >(
        type: K,
        dataKey: D,
        value: V
    ): T[K] {

        // @ts-ignore because we are sure that its safe
        descriptor[type][dataKey] = value
        return descriptor[type]
    }

    function getEvent<K extends keyof T>(type: K): T[K] {
        return descriptor[type] as T[K];
    }

    return { updateEvent, getEvent };
}

// const eventManager = createEventManager<WorldAttachableEventMap<any>>({
// 	attachedToCtx: { type: "worldattached", world: {} as any },
// 	detachedFromCtx: { type: "worlddetached", world: {} as any },
// });

// const gameWorld = {} as GameWorld;

// // Обновляем событие, типы данныхKey и value выводятся автоматически
// eventManager.updateEvent("worlddetached", "world", gameWorld);

// // Получаем обновлённое событие
// const event = eventManager.getEvent("worldattached");
// console.log(event);