import { useEffect } from 'react';

import { BaseNotifier } from '../base/base';
import type { UseEventHook } from '../dist/types';
import { EventSubject } from '../subjects/eventSubject';
import { Unsubscribe } from '../subjects/subject';

export class EventNotifier<State, EventType extends Record<string, any>> extends BaseNotifier<State> {
    readonly #subject: EventSubject<EventType>;

    constructor (initialState: State) {
        super(initialState);
        this.#subject = new EventSubject<EventType>();
    }

    public on <Event extends keyof EventType> (event: Event, callback: (data: EventType[Event]) => void): Unsubscribe {
        return this.#subject.subscribe(event, callback);
    }

    public createEvents (): UseEventHook<EventType> {
        return (event, callback) => {
            useEffect(() => {
                const unsubscribe = this.#subject.subscribe(event, callback);

                return () => {
                    unsubscribe();
                };
            }, [event, callback]);
        };
    }

    protected emit <Event extends keyof EventType> (event: Event, data: EventType[Event]): void {
        this.#subject.publish(event, data);
    }
}
