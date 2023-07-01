import { useSyncExternalStore } from 'react';

import { Subject, Unsubscribe, Subscriber } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';

type ClassMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

type PublicMethods<T> = Omit<ClassMethods<T>, keyof BaseNotifier<any>>;

type UseSetterHook<Notifier extends BaseNotifier<any>> = () => PublicMethods<Notifier>;

type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;

export type UseNotifierHook<Data> =<ReturnType = Data>(selector?: SelectorFunc<Data, ReturnType>) => ReturnType;

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

    createHook (): UseNotifierHook<Data> {
        return <ReturnType>(selector?: SelectorFunc<Data, ReturnType>) => {
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
    }

    createActors (): UseSetterHook<this> {
        return () => this._getPublicMethods();
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
        const isAccessor = (prop: string) => {
            const obj = Object.getPrototypeOf(this);
            const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

            return Boolean(descriptor && (descriptor.get || descriptor.set));
        };

        return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter((name) => !name.startsWith('_'))
            .filter((name) => name !== 'constructor')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .filter((name) => typeof this[name] === 'function')
            .filter((name) => !isAccessor(name))
            .reduce((methods, name) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                methods[name] = this[name].bind(this);

                return methods;
            }, {} as PublicMethods<this>);
    }
}
