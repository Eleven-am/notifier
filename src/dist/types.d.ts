type Unsubscribe = () => void;

type Observer<State> = (state: State) => void;

export declare class Notifier<Data> {
    constructor(initialState: Data);

    protected get serverState(): Readonly<Data>;

    protected set serverState(state: Data);

    protected get state(): Readonly<Data>;

    protected set state(state: Data);

    subscribe(callback: (state: Data) => void): Unsubscribe;

    reset(): void;

    protected updateState(state: Partial<Data>): void;
}

export declare class EventNotifier<State, EventType extends Record<string, any>> extends Notifier<State> {
    constructor(initialState: State);

    protected on<Event extends keyof EventType>(event: Event, callback: (data: EventType[Event]) => void): Unsubscribe;

    protected emit<Event extends keyof EventType>(event: Event, data: EventType[Event]): void;
}

type GetFunction = <NotifierState>(notifier: Notifier<NotifierState>) => Readonly<NotifierState>;

type SetFunction = <NotifierState>(notifier: Notifier<NotifierState>, state: NotifierState) => void;

type SelectorHandler<ReturnedState> = (get: GetFunction, set: SetFunction) => Promise<ReturnedState> | ReturnedState;

type SelectorFunc<State, ReturnType> = (state: State) => ReturnType;

declare class Selector<DataType> {}

declare function selector<ReturnedState>(selector: SelectorHandler<ReturnedState>): Selector<ReturnedState>;

declare function useNotifier<State, ReturnType = State>(notifier: Notifier<State> | Selector<State>, selector?: SelectorFunc<State, ReturnType>): ReturnType;
