import { BaseNotifier } from '../base/base';
import { EventSubject } from '../subjects/eventSubject';
import { Unsubscribe } from '../subjects/subject';


export class EventNotifier<State, EventType extends Record<string, any>> extends BaseNotifier<State> {
    readonly #subject: EventSubject<EventType>;

    constructor (initialState: State) {
        super(initialState);
        this.#subject = new EventSubject<EventType>();
    }

    protected on <Event extends keyof EventType> (event: Event, callback: (data: EventType[Event]) => void): Unsubscribe {
        return this.#subject.subscribe(event, callback);
    }

    protected emit <Event extends keyof EventType> (event: Event, data: EventType[Event]): void {
        this.#subject.publish(event, data);
    }
}
