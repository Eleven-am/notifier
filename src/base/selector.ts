import { BaseNotifier } from './base';
import { Subject, Unsubscribe } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';

type GetFunction = <NotifierState>(notifier: BaseNotifier<NotifierState>) => Readonly<NotifierState>;
type SetFunction = <NotifierState>(notifier: BaseNotifier<NotifierState>, state: NotifierState) => void;
type SelectorHandler<ReturnedState> = (get: GetFunction, set: SetFunction) => Promise<ReturnedState> | ReturnedState;
export type SelectorType<DataType> = ReturnType<typeof selector<DataType>>;

export function selector<ReturnedState> (selector: SelectorHandler<ReturnedState>) {
    const notifiers = new Set<BaseNotifier<any>>();
    const subject = new Subject<ReturnedState>();

    const get: GetFunction = (notifier) => {
        notifiers.add(notifier);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        subscribeToNotifier(notifier);

        return notifier['state'];
    };

    const getServer: GetFunction = (notifier) => {
        notifiers.add(notifier);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        subscribeToNotifier(notifier);

        return notifier['serverState'];
    };

    const set: SetFunction = (notifier, state) => {
        if (!notifiers.has(notifier)) {
            return;
        }

        notifier['state'] = state;
    };

    let returnedState: ReturnedState;
    let serverState: ReturnedState;

    const initialiseValues = async () => {
        returnedState = await selector(get, set);
        serverState = await selector(getServer, set);
    };

    void initialiseValues();

    function subscribeToNotifier (notifier: BaseNotifier<any>) {
        if (notifiers.has(notifier)) {
            return;
        }

        notifier.subscribe(async () => {
            const newState = await selector(get, set);

            if (!deepCompare(returnedState, newState)) {
                subject.publish(newState);
                returnedState = newState;
            }
        });
    }

    function subscribe (callback: (state: ReturnedState) => void): Unsubscribe {
        return subject.subscribe(callback);
    }

    const getSnapshot = () => returnedState;
    const getServerSnapshot = () => serverState;

    return {
        subscribe,
        getSnapshot,
        getServerSnapshot,
    };
}
