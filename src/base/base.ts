import { Subject, Unsubscribe } from '../subjects/subject';

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

    subscribe (callback: (state: Data) => void): Unsubscribe {
        return this.#subject.subscribe(callback);
    }

    protected updateState (state: Partial<Data>): void {
        this.state = {
            ...this.state,
            ...state,
        };
    }

    protected reset (): void {
        this.#state = this.#initialState;
        this.#serverState = null;
    }
}
