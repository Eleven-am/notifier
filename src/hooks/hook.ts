import { useSyncExternalStore } from 'react';

import { BaseNotifier } from '../base/base';
import { SelectorType } from '../base/selector';
import { deepCompare } from '../utils/deepCompare';

type Selector<State, ReturnType> = (state: State) => Promise<ReturnType> | ReturnType;

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

    const getServerState = () => {
        let state: State;

        if (notifier instanceof BaseNotifier) {
            state = notifier.serverState;
        } else {
            state = notifier.getServerSnapshot();
        }

        const selectorState = selector ? selector(state) : state;

        return selectorState as ReturnType;
    };

    const serverState = getServerState();

    const getState = () => {
        let state: State;

        if (notifier instanceof BaseNotifier) {
            state = notifier.state;
        } else {
            state = notifier.getSnapshot();
        }

        const selectorState = selector ? selector(state) : state;

        return selectorState as ReturnType;
    };

    let oldState = getState();

    const subscribe = (callback: (state: ReturnType) => void) => notifier.subscribe((state) => {
        const newState = selector ? selector(state) : state;

        if (!deepCompare(oldState, newState)) {
            oldState = newState as ReturnType;

            return callback(newState as ReturnType);
        }
    });

    const getSnapshot = () => oldState;
    const getServerSnapshot = () => serverState;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
