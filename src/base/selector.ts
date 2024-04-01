import { useSyncExternalStore } from 'react';

import { BaseNotifier } from './base';
import { Subject } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';


type SelectorHook<State> = ReturnType<typeof selector<State>>;
type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;
type UseNotifierHook<State> = <ReturnType = State>(selector?: SelectorFunc<State, ReturnType>) => ReturnType;
type GetFunction = <NotifierState>(notifier: BaseNotifier<NotifierState> | SelectorHook<NotifierState>) => Readonly<NotifierState>;
type SetFunction = <NotifierState>(notifier: BaseNotifier<NotifierState>, state: NotifierState) => void;
type SelectorHandler<ReturnedState> = (get: GetFunction, set: SetFunction) => Promise<ReturnedState> | ReturnedState;

export function selector<ReturnedState> (selector: SelectorHandler<ReturnedState>) {
    const notifiers = new Set<BaseNotifier<unknown> | SelectorHook<unknown>>();
    const subject = new Subject<ReturnedState>();

    const get: GetFunction = (notifier) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        subscribeToNotifier(notifier);

        if (notifier instanceof BaseNotifier) {
            return notifier['state'];
        }

        return notifier.getSnapshot();
    };

    const getServer: GetFunction = (notifier) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        subscribeToNotifier(notifier);

        if (notifier instanceof BaseNotifier) {
            return notifier['serverState'];
        }

        return notifier.getServerSnapshot();
    };

    const set: SetFunction = (notifier, state) => notifier['state'] = state;

    let returnedState: ReturnedState;
    let serverState: ReturnedState;

    function initialiseValues () {
        const serverPromise = selector(getServer, set);
        const clientPromise = selector(get, set);

        if (serverPromise instanceof Promise) {
            serverPromise.then((state) => {
                serverState = state;
            });
        } else {
            serverState = serverPromise;
        }

        if (clientPromise instanceof Promise) {
            clientPromise.then((state) => {
                returnedState = state;
                subject.publish(state);
            });
        } else {
            returnedState = clientPromise;
            subject.publish(clientPromise);
        }
    }

    initialiseValues();

    function subscribeToNotifier (notifier: BaseNotifier<any> | SelectorHook<any>) {
        if (notifiers.has(notifier)) {
            return;
        }

        notifiers.add(notifier);
        notifier.subscribe(async () => {
            const newState = await selector(get, set);

            if (!deepCompare(returnedState, newState)) {
                subject.publish(newState);
                returnedState = newState;
            }
        });
    }

    function createHook (): UseNotifierHook<ReturnedState> {
        return <ReturnType>(selector?: SelectorFunc<ReturnedState, ReturnType>): ReturnType => {
            let clientState = selector ? selector(returnedState) : returnedState as unknown as ReturnType;
            const newServerState = selector ? selector(serverState) : serverState as unknown as ReturnType;

            const subscribe = (callback: (state: ReturnType) => void) => subject.subscribe((state) => {
                const newState = selector ? selector(state) : state as unknown as ReturnType;

                if (!deepCompare(clientState, newState)) {
                    clientState = newState;

                    return callback(newState);
                }
            });

            const getSnapshot = () => clientState;
            const getServerSnapshot = () => newServerState;

            return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        };
    }

    return {
        subscribe: subject.subscribe.bind(subject),
        getServerSnapshot: () => serverState,
        getSnapshot: () => returnedState,
        createHook,
    };
}

export const getSnapshot: GetFunction = (notifier) => {
    if (notifier instanceof BaseNotifier) {
        return notifier['state'];
    }

    return notifier.getSnapshot();
};
