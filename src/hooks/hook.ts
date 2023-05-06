import { useSyncExternalStore } from 'react';

import { BaseNotifier } from '../base/base';
import { SelectorType } from '../base/selector';
import { Subject, Subscriber, Unsubscribe } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';

type Selector<State, ReturnType> = (state: State) => ReturnType;

export function useNotifier<State, ReturnType = State> (
    notifier: BaseNotifier<State> | SelectorType<State>,
    selector?: Selector<State, ReturnType>,
): ReturnType {
    if (selector && typeof selector !== 'function') {
        throw new Error('Invalid selector function');
    }

    if (!(notifier instanceof BaseNotifier) && typeof notifier !== 'object') {
        throw new Error('Invalid notifier object');
    }

    if (!(notifier instanceof BaseNotifier) && typeof notifier === 'object' && (
        typeof notifier.subscribe !== 'function' ||
        typeof notifier.getSnapshot !== 'function' ||
        typeof notifier.getServerSnapshot !== 'function'
    )) {
        throw new Error('Notifier object must have subscribe, getSnapshot, and getServerSnapshot methods');
    }

    const subject = new Subject<ReturnType>();
    let previousState: ReturnType;

    function performSelection (state: State) {
        if (selector) {
            return selector(state);
        }

        return state as unknown as ReturnType;
    }

    function getClientState () {
        notifier.subscribe((state) => {
            const newState = performSelection(state);

            if (!deepCompare(previousState, newState)) {
                previousState = newState;
                subject.publish(newState);
            }
        });

        if (notifier instanceof BaseNotifier) {
            return performSelection(notifier['state']);
        }

        return performSelection(notifier.getSnapshot());
    }

    function getServerState () {
        if (notifier instanceof BaseNotifier) {
            return performSelection(notifier['serverState']);
        }

        return performSelection(notifier.getServerSnapshot());
    }

    function subscribe (callback: Subscriber<ReturnType>): Unsubscribe {
        return subject.subscribe(callback);
    }

    const serverState = getServerState();

    previousState = getClientState();

    const getSnapshot = () => previousState;
    const getServerSnapshot = () => serverState;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
