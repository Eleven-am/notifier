import { Subscriber, Unsubscribe } from './subject';

export class EventSubject<EventType extends Record<string, any>> {
    #observers: Map<keyof EventType, Set<Subscriber<EventType[keyof EventType]>>>;

    constructor () {
        this.#observers = new Map<keyof EventType, Set<Subscriber<EventType[keyof EventType]>>>();
    }

    /**
     * @desc Returns the number of subscribers
     */
    get size () {
        return this.#observers.size;
    }

    /**
     * @desc Subscribes to a subject
     * @param event - The event to subscribe to
     * @param observer - The observer to subscribe
     */
    subscribe <Event extends keyof EventType> (event: Event, observer: Subscriber<EventType[Event]>): Unsubscribe {
        const observers = this.#observers.get(event) ?? new Set<Subscriber<EventType[Event]>>();

        observers.add(observer);
        this.#observers.set(event, observers as Set<Subscriber<EventType[keyof EventType]>>);

        return () => {
            const observers = this.#observers.get(event);

            if (observers) {
                observers.delete(observer as Subscriber<EventType[keyof EventType]>);
            }
        };
    }

    /**
     * @desc Publishes a message to all subscribers
     * @param event - The event to publish
     * @param message - The message to publish
     */
    publish (event: keyof EventType, message: EventType[keyof EventType]) {
        const observers = this.#observers.get(event);

        if (observers) {
            observers.forEach((observer) => observer(message));
        }
    }
}
