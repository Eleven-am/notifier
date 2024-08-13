import { useState, useEffect, useSyncExternalStore } from 'react';

import { Subject, Unsubscribe, Subscriber } from '../subjects/subject';
import { deepCompare } from '../utils/deepCompare';

type ClassMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

type PublicMethods<T> = Omit<ClassMethods<T>, keyof BaseNotifier<any>>;

type UseActorsHook<Class extends BaseNotifier<any>> = () => PublicMethods<Class>;

type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;

export type UseNotifierHook<Data> =<ReturnType = Data>(selector?: SelectorFunc<Data, ReturnType>) => ReturnType;

type InstanceOf<T> = T extends { prototype: infer R } ? R : never;
type IgnoreConstructor<T> = Pick<T, keyof T>;
type Subclass = IgnoreConstructor<typeof BaseNotifier>;
type ConstructorParams<Class> = Class extends new (...args: infer Params) => any ? Params : never;
type SubClassData<Sub extends Subclass> = InstanceOf<Sub> extends BaseNotifier<infer Data> ? Data : never;

type UseFactoryHook<Sub extends Subclass> =
    <ReturnType = SubClassData<Sub>>(selector?: SelectorFunc<SubClassData<Sub>, ReturnType>) =>
    ReturnType & PublicMethods<InstanceOf<Sub>>;

const defaultSelector: SelectorFunc<any, any> = (state) => state;

export class BaseNotifier<Data> {
    readonly #subject: Subject<Data>;

    readonly #initialState: Data;

    readonly #actors: PublicMethods<this>;

    #serverState: Data | null;

    #state: Data;

    constructor (initialState: Data) {
        this.#initialState = initialState;
        this.#state = initialState;
        this.#serverState = null;
        this.#subject = new Subject<Data>();
        this.#actors = this.#getPublicMethods();
    }

    protected get serverState (): Readonly<Data> {
        return this.#serverState ?? this.#initialState;
    }

    protected set serverState (state: Data) {
        if (this.#serverState) {
            return;
        }

        this.#serverState = state;
        this.#state = state;
    }

    protected get state (): Readonly<Data> {
        return this.#state;
    }

    protected set state (state: Data) {
        this.#state = state;
        this.#subject.publish(state);
    }

    static createFactoryHook <SubClass extends Subclass> (this: SubClass, ...params: ConstructorParams<SubClass>): UseFactoryHook<SubClass> {
        return <ReturnType>(selector?: SelectorFunc<SubClassData<SubClass>, ReturnType>) => {
            const [instance, setInstance] = useState(() => this.build(...params));
            const state = instance.createHook()(selector);
            const actors = instance.createActors()();

            useEffect(() => {
                setInstance(this.build(...params));
            }, [...params]);

            return {
                ...state,
                ...actors,
            };
        };
    }

    static build <SubClass extends Subclass> (this: SubClass, ...params: ConstructorParams<SubClass>): InstanceOf<SubClass> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return new this(...params);
    }

    createHook (): UseNotifierHook<Data> {
        return <ReturnType>(selector: SelectorFunc<Data, ReturnType> = defaultSelector) => {
            const serverState = selector(this.serverState);
            let clientState = selector(this.state);

            const subscribe = (callback: () => void) => this.#subject.subscribe((state) => {
                const newState = selector(state);

                if (!deepCompare(clientState, newState)) {
                    clientState = newState;

                    return callback();
                }
            });

            const getSnapshot = () => clientState;
            const getServerSnapshot = () => serverState;

            return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        };
    }

    reset (): void {
        this.#state = this.#initialState;
    }

    createActors (): UseActorsHook<this> {
        return () => this.#actors;
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

    #getPublicMethods (): PublicMethods<this> {
        const isAccessor = (prop: string, obj: any): boolean => {
            const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

            return Boolean(descriptor && (descriptor.get || descriptor.set));
        };

        function getAllMethodNames (obj: any): string[] {
            const objectPrototype = Object.getPrototypeOf({});
            const objectKeys = Reflect.ownKeys(objectPrototype);
            const methods = new Set<string>();

            // eslint-disable-next-line no-cond-assign
            while (obj = Reflect.getPrototypeOf(obj)) {
                const keys = Reflect.ownKeys(obj);

                keys
                    .map((k) => k.toString())
                    .filter((name) => !objectKeys.includes(name))
                    // eslint-disable-next-line no-loop-func
                    .filter((name) => !isAccessor(name, obj))
                    .forEach((k) => methods.add(k));
            }

            return Array.from(methods)
                .filter((k) => !k.startsWith('#') && !k.startsWith('_') && k !== 'constructor');
        }

        return getAllMethodNames(this)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .filter((name) => typeof this[name] === 'function')
            .reduce((methods, name) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                methods[name] = this[name].bind(this);

                return methods;
            }, {} as PublicMethods<this>);
    }
}
