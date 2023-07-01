type GetFunction = <NotifierState>(notifier: Notifier<NotifierState> | Selector<NotifierState>) => Readonly<NotifierState>;

type SetFunction = <NotifierState>(notifier: Notifier<NotifierState>, state: NotifierState) => void;

type ClassMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

type PublicMethods<T> = Omit<ClassMethods<T>, keyof Notifier<any>>;

type UseActorsHook<Class extends Notifier<any>> = () => PublicMethods<Class>;

type SelectorHandler<ReturnedState> = (get: GetFunction, set: SetFunction) => Promise<ReturnedState> | ReturnedState;

type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;

type UseNotifierHook<State> = <ReturnType = State>(selector?: SelectorFunc<State, ReturnType>) => ReturnType;

type Unsubscribe = () => void;

type Observer<Data> = (data: Data) => void;

export declare class Notifier<Data> {
    constructor(initialState: Data);

    protected get state(): Readonly<Data>;

    protected set state(value: Data);

    protected get serverState(): Readonly<Data>;

    protected set serverState(value: Data);

    createHook(): UseNotifierHook<Data>;

    createActors (): UseActorsHook<this>;

    reset(): void;

    protected updateState(state: Partial<Data>): void;
}

export declare class EventNotifier<State, EventType extends Record<string, any>> extends Notifier<State> {
    constructor(initialState: State);

    public on<Event extends keyof EventType>(event: Event, callback: (data: EventType[Event]) => void): Unsubscribe;

    protected emit<Event extends keyof EventType>(event: Event, data: EventType[Event]): void;
}

declare class Selector<DataType> {
    createHook(): UseNotifierHook<DataType>;
}

declare function selector<ReturnedState>(selector: SelectorHandler<ReturnedState>): Selector<ReturnedState>;
