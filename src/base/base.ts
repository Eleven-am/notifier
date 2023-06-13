import { useSyncExternalStore } from 'react';

import { Subject, Unsubscribe, Subscriber } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';

type PublicMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;

export type UseNotifierHook<Data, Class extends BaseNotifier<Data>> = {
    useValue: <ReturnType = Data>(selector?: SelectorFunc<Data, ReturnType>) => ReturnType;
    useSetState: () => PublicMethods<Class>;
    useHook: <ReturnType = Data>(selector?: SelectorFunc<Data, ReturnType>) => ReturnType & PublicMethods<Class>;
}

export class BaseNotifier<Data> {
    readonly #subject: Subject<Data>;

    readonly #initialState: Data;

    #serverState: Data | null;

    #state: Data;

    constructor (initialState: Data) {
        this.#initialState = initialState;
        this.#state = initialState;
        this.#serverState = null;
        this.#subject = new Subject<Data>();
    }

    protected get serverState (): Readonly<Data> {
        return this.#serverState ?? this.#initialState;
    }

    protected set serverState (state: Data) {
        if (this.#serverState) {
            return;
        }

        this.#serverState = state;
        this.state = state;
    }

    protected get state (): Readonly<Data> {
        return this.#state;
    }

    protected set state (state: Data) {
        this.#state = state;
        this.#subject.publish(state);
    }

    reset (): void {
        this.#state = this.#initialState;
        this.#serverState = null;
    }

    createHooks (): UseNotifierHook<Data, this> {
        const useValue = <ReturnType>(selector?: SelectorFunc<Data, ReturnType>) => {
            const serverState = selector ? selector(this.serverState) : this.serverState as unknown as ReturnType;
            let clientState = selector ? selector(this.state) : this.state as unknown as ReturnType;

            const subscribe = (callback: (state: ReturnType) => void) => this.#subject.subscribe((state) => {
                const newState = selector ? selector(state) : state as unknown as ReturnType;

                if (!deepCompare(clientState, newState)) {
                    clientState = newState;

                    return callback(newState);
                }
            });

            const getSnapshot = () => clientState;
            const getServerSnapshot = () => serverState;

            return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        };

        const useSetState = (): PublicMethods<this> => this._getPublicMethods();

        const useHook = <ReturnType>(selector?: SelectorFunc<Data, ReturnType>) => {
            const value = useValue(selector);

            return {
                ...value,
                ...useSetState(),
            };
        };

        return {
            useHook,
            useValue,
            useSetState,
        };
    }

    subscribe (subscriber: Subscriber<Data>): Unsubscribe {
        return this.#subject.subscribe(subscriber);
    }

    protected updateState (state: Partial<Data>): void {
        this.state = {
            ...this.state,
            ...state,
        };
    }

    private _getPublicMethods (): PublicMethods<this> {
        const methods: PublicMethods<this> = {} as PublicMethods<this>;

        for (const key in this) {
            if (typeof this[key] === 'function') {
                methods[key] = (this[key] as Function).bind(this);
            }
        }

        return methods;
    }
}
