# Notifier

The Notifier package is a robust and scalable solution for managing global state in React applications. It provides a centralized store for shared state, promoting code organization, reusability, and simplifying state synchronization across components. With its easy-to-use hooks and powerful features, the Notifier package enhances code maintainability and scalability.

## Installation

Install the Notifier package using npm:

```bash
npm install notifier
```

## Usage

The core is the `Notifier` class, which encapsulates state management. It exposes a protected `state` variable to hold the current state of the Notifier instance. This ensures that the state remains encapsulated and not directly accessible from outside the class.

For example, let's create a `PersonNotifier` class to manage a person's name and age:

```typescript
class PersonNotifier extends Notifier<{ name: string; age: number }> {
  setName(name: string) {
    this.updateState({ name });
    // this.state = { ...this.state, name };
  }

  setAge(age: number) {
    this.updateState({ age });
  }
}
```

To use the `PersonNotifier` as a global state manager in your React application, follow these steps:

1. Import the required dependencies:

```typescript
import { Notifier } from 'notifier';
```

2. Create an instance of `PersonNotifier` and initialize the state:

```typescript
const personNotifier = new PersonNotifier({ name: 'John Doe', age: 25 });
```

3. Create a hook to access and update the person's state:

```typescript
const usePerson = personNotifier.createHook().useHook;
```

4. Use the created hook within your functional components:

```typescript
const PersonComponent: React.FC = () => {
  // The transform function in the usePerson hook is optional
  const { name, age, setName, setAge } = usePerson(state => ({
    name: state.name.toUpperCase(),
    age: state.age,
  }));

  console.log(state);

  return (
    <div>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
    </div>
  );
};
```

By following these steps, you can effectively manage the state of a person's name and age throughout your React application.

## Selectors

The Notifier package provides a powerful feature called selectors, which allow you to derive state from one or more Notifiers. A selector takes a `SelectorHandler` function as an argument, providing `get` and `set` functions for retrieving and updating Notifiers' state. Selectors support asynchronous operations as well, making it convenient to perform asynchronous tasks within the function.

To demonstrate the usage of selectors, let's calculate the sum of two counters managed by different Notifiers:

```typescript
const sumSelector = selector((get, set) => {
  const counter1 = get(counterNotifier1);
  const counter2 = get(counterNotifier2);

  return counter1 + counter2;
});
```

To access the derived state, create a hook using the `createHook` method of the selector:

```typescript
const useSum = sumSelector.createHook();
```

The `useSum` hook can then be used within your functional components:

```typescript
const SumComponent: React.FC = () => {
  // The transform function in the useSum hook is optional
  const sum = useSum(state => `${state}`);

  console.log(sum);

  return (
    <div>
      <p>Sum: {sum}</p>
    </div>
  );
};
```

By utilizing selectors, you can efficiently compute and derive state from multiple

Notifiers, enabling clean and reusable state transformations. Selectors are memoized, executing the `SelectorHandler` function only when the dependent Notifiers are updated.

### EventNotifier

The `EventNotifier` class extends the `Notifier` class in the Notifier package, providing additional functionality for event-based communication. It facilitates inter-component communication by allowing components to subscribe to events and trigger callbacks when those events are emitted.

To use the `EventNotifier` class, follow these steps:

1. Create a subclass of `EventNotifier` and define your custom state:

```typescript
class MyEventNotifier extends EventNotifier<MyState, MyEvent> {
  // Define your custom state and methods here
}

interface MyState {
  // Define your state properties here
}

interface MyEvent {
  // Define your event types here
  // For example, 'dataUpdated' event that emits the updated data
  dataUpdated: MyData;
}
```

2. Implement your custom logic and methods within the subclass. For example, let's define an event called `dataUpdated` that is emitted when the data is updated:

```typescript
class MyEventNotifier extends EventNotifier<MyState> {
  updateData(data: MyData) {
    // Perform the data update logic here
    this.updateState({ data });

    // Emit the 'dataUpdated' event with the updated data
    this.emit('dataUpdated', data);
  }
}
```

3. Create a hook to access and update the state:

```typescript
const useMyEventNotifier = new MyEventNotifier(myInitialState).createHook().useHook;
```

4. Use the created hook within your functional components. Subscribe to the `dataUpdated` event and handle it using a callback function:

```typescript
const MyComponent: React.FC = () => {
  const { state, on } = useMyEventNotifier();
  
  const handleDataUpdated = (data: MyData) => {
    // Handle the 'dataUpdated' event here
    console.log('Data updated:', data);
  };

  useEffect(() => {
    const unsubscribe = on('dataUpdated', handleDataUpdated);

    return () => {
        unsubscribe(); // Unsubscribe from the event when the component unmounts
    };
  }, [on]);

  return (
    // JSX code here
  );
}
```

The `EventNotifier` class enables efficient event-based communication between components, allowing for decoupled and reactive architectures in your React application.

## Conclusion
In summary, the Notifier package offers a powerful solution for managing global state in React applications. By leveraging classes instead of objects, it brings significant advantages to state management. Classes provide improved encapsulation, access control, and instance-specific data, leading to better code organization and maintainability.

Additionally, using classes promotes code reusability, allowing developers to extend and customize the Notifier package's functionality. This enables efficient code sharing and reduces redundancy, resulting in cleaner codebases.

The support for inheritance and polymorphism offered by classes empowers developers to build upon existing functionality and create specialized state management solutions. This flexibility ensures that the Notifier package can handle complex state management scenarios and adapt to evolving requirements.

By choosing the Notifier package and its class-based approach, React developers can simplify state synchronization, establish a single source of truth, and enhance reusability and maintainability in their projects.
