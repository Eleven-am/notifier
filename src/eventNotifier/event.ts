import { BaseNotifier } from '../base/base';
import { EventSubject } from '../subjects/eventSubject';
import { Unsubscribe } from '../subjects/subject';

export class EventNotifier<State, EventType extends Record<string, any>> extends BaseNotifier<State> {
    readonly #subject: EventSubject<EventType>;

    constructor (initialState: State) {
        super(initialState);
        this.#subject = new EventSubject<EventType>();
    }

    protected on (event: keyof EventType, callback: (data: EventType[typeof event]) => void): Unsubscribe {
        return this.#subject.subscribe(event, callback);
    }

    protected emit (event: keyof EventType, data: EventType[typeof event]): void {
        this.#subject.publish(event, data);
    }
}
