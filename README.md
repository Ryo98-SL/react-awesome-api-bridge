# react-api-bridge
> **Language**: [English](#) | [简体中文](./README.zh-CN.md)

A React library for sharing imperative APIs between components without prop drilling. Register APIs in one component and access them anywhere in your component tree.

<img src="./logo/react-api-bridge-logo.png" alt="Alt text" width="200"  height="auto">

## Why Use This?

- **No Prop Drilling**: Access component APIs from anywhere without passing refs through props
- **Better Performance**: Update APIs won't result in redundant re-render, expect payload
- **Flexible Boundaries**: Control API scope with boundaries
- **Type Safe**: Full TypeScript support with strongly typed APIs
- **Multi-Instance Support**: Register multiple instances of the same API
- **Async Ready**: Wait for APIs to be registered with promises

## Quick Start

### Installation

```bash
npm install @ryo-98/react-api-bridge
```

### Basic Example

```tsx
import { createBridge, useAPI, useRegister, getBridgeAPI } from '@ryo-98/react-api-bridge';

// Define your API types
interface MyAPIs {
    counter: {
        getCount: () => number;
        increment: () => void;
    };
    user: {
        getName: () => string;
        setName: (name: string) => void;
    };
}

// Create a bridge
const bridge = createBridge<MyAPIs>();

// Component that registers an API
function Counter() {
    const [count, setCount] = useState(0);

    // Register the API
    useRegister(bridge, 'counter', () => ({
        getCount: () => count,
        increment: () => setCount(c => c + 1)
    }), [count]);

    return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

// Component that uses the API (can be anywhere in the tree!)
function CounterDisplay() {
    const counterAPI = useAPI(bridge, 'counter');

    const showCount = () => {
        if (counterAPI.current) {
            alert(`Current count: ${counterAPI.current.getCount()}`);
        }
    };

    return <button onClick={showCount}>Show Count</button>;
}

// Access API outside of components
function GlobalAccess() {
    const handleClick = () => {
        const counterAPI = getBridgeAPI(bridge, 'counter');
        if (counterAPI.current) {
            counterAPI.current.increment();
        }
    };

    return <button onClick={handleClick}>Increment from outside</button>;
}

function App() {
    return (
        <div>
            <Counter />
            <CounterDisplay />
            <GlobalAccess />
        </div>
    );
}
```

## Core Concepts

### 1. Bridge Creation

```tsx
// Basic bridge with TypeScript
interface MyAPIs {
    counter: { increment: () => void };
    user: { getName: () => string };
}

const bridge = createBridge<MyAPIs>();

// Bridge with global payload
const bridge = createBridge<MyAPIs, { theme: string }>({ theme: 'dark' });

// Bridge with API options
const bridge = createBridge<MyAPIs>()({
    counter: { isMulti: true } // Allow multiple instances
});
```

### 2. Registering APIs

Use `useRegister` to make component methods available to other components:

```tsx
function MyComponent({ name }: { name: string }) {
    const [value, setValue] = useState('');

    useRegister(bridge, 'myAPI', () => ({
        getValue: () => value,
        setValue: (newValue: string) => setValue(newValue),
        getName: () => name
    }), [value, name]); // Dependencies like useEffect

    return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

### 3. Using APIs

Access registered APIs with `useAPI`:

```tsx
function ConsumerComponent() {
    const myAPI = useAPI(bridge, 'myAPI', {
        // Optional: callback when API first becomes available
        onInit: (apiRef) => {
            console.log('API ready:', apiRef.current?.getValue());

            // Return cleanup function if needed
            return () => console.log('Cleaning up');
        }
    });

    const handleClick = () => {
        if (myAPI.current) {
            myAPI.current.setValue('Hello from consumer!');
        }
    };

    return <button onClick={handleClick}>Update Value</button>;
}
```

## Boundaries

Boundaries control which components can access which APIs. Think of them as scopes.

### Basic Boundary Usage

```tsx
import { createBoundary } from '@ryo-98/react-api-bridge';

const Boundary = createBoundary(bridge);

function App() {
    return (
        <div>
            <MyComponent name="global" /> {/* Global scope */}

            <Boundary>
                <MyComponent name="scoped" /> {/* Boundary scope */}
                <ConsumerComponent /> {/* Can only see "scoped" API */}
            </Boundary>

            <ConsumerComponent /> {/* Can only see "global" API */}
        </div>
    );
}
```

### Boundary Payloads

Pass data to all components within a boundary:

```tsx
function App() {
    return (
        // You can wrap this object with useMemo to prevent redundant re-render   
        <Boundary payload={{ theme: 'dark', user: 'john' }}>
            <MyComponent />
        </Boundary>
    );
}

function MyComponent() {
    const payload = useBoundaryPayload(bridge);
    console.log(payload); // { theme: 'dark', user: 'john' }
}
```

### Connecting Boundaries

Share context between boundaries:

```tsx
function App() {
    const contextValue = useBoundaryContext(bridge, { shared: 'data' });

    return (
        <div>
            <Boundary contextValue={contextValue}>
                <ComponentA />
            </Boundary>

            {/* This boundary shares the same context */}
            <Boundary contextValue={contextValue}>
                <ComponentB /> {/* Can see ComponentA's APIs */}
            </Boundary>
        </div>
    );
}
```

## Advanced Features

### Accessing Parent Boundaries

Use `useUpperAPI` to access APIs from parent boundaries:

```tsx
function NestedComponent() {
    const currentAPI = useAPI(bridge, 'myAPI');      // Current boundary
    const parentAPI = useUpperAPI(bridge, 'myAPI'); // Parent boundary

    const rootAPI = useUpperAPI(bridge, 'myAPI', {
        // Find specific boundary by condition
        shouldForwardYield: (boundary) => !boundary.parent // Root boundary
    });
}
```

### Async API Access

Wait for APIs to be registered:

```tsx
import { getBridgeAPIAsync, useTools } from '@ryo-98/react-api-bridge';

// Outside components
getBridgeAPIAsync(bridge, 'myAPI')
    .then(apiRef => {
        console.log('API ready:', apiRef.current?.getValue());
    });

// Inside components
function MyComponent() {
    const { getAPIAsync } = useTools(bridge);

    useEffect(() => {
        getAPIAsync('myAPI').then(apiRef => {
            // API is now available
        });
    }, []);
}
```

### Multiple API Instances

Allow multiple components to register the same API name:

```tsx
const bridge = createBridge<{
    notifications: {
        id: string;
        showNotification: (msg: string) => void;
    };
}>()({
    notifications: { isMulti: true }
});

function NotificationProvider({ type, id }: { type: string; id: string }) {
    useRegister(bridge, 'notifications', () => ({
        id,
        showNotification: (msg: string) => console.log(`${type}: ${msg}`)
    }), [type, id]);
}

function App() {
    return (
        <div>
            <NotificationProvider id="foo" type="success" />
            <NotificationProvider id="bar" type="error" />
            <NotificationConsumer />
        </div>
    );
}

function NotificationConsumer() {
    const notificationAPIs = useAPI(bridge, 'notifications'); // Array of APIs

    const showAll = () => {
        notificationAPIs.forEach(api => {
            if (api.current?.id === 'foo') {
                console.log('foo!');
            }
            api.current?.showNotification('Hello!');
        });
    };

    return <button onClick={showAll}>Show All Notifications</button>;
}
```

### Tool Hooks

Access bridge functionality programmatically:

```tsx
function MyComponent() {
    const {
        getAPI,
        getBoundaryPayload,
        getUpperAPI,
        getUpperBoundaryPayload,
        getAPIAsync
    } = useTools(bridge);

    const handleClick = () => {
        const api = getAPI('myAPI');
        const payload = getBoundaryPayload();
        // Use APIs without hooks
    };
}
```

## TypeScript Support

Define strongly typed APIs:

```typescript
interface MyAPIs {
    counter: {
        getCount: () => number;
        increment: () => void;
    };
    user: {
        getName: () => string;
        setName: (name: string) => void;
    };
}

type PayloadType = { theme: string; locale: string };

const bridge = createBridge<MyAPIs, PayloadType>({
    theme: 'light',
    locale: 'en'
});

// Now everything is typed!
function MyComponent() {
    useRegister(bridge, 'counter', () => ({
        getCount: () => 42,
        increment: () => console.log('increment')
        // TypeScript will enforce this matches the interface
    }), []);

    const counterAPI = useAPI(bridge, 'counter'); // Fully typed
    const payload = useBoundaryPayload(bridge); // PayloadType
}
```

## Common Patterns

### Modal Manager

```tsx
const modalBridge = createBridge<{
    modals: {
        show: (content: string) => void;
        hide: (id: number) => void;
    };
}>();

function ModalManager() {
    const [modals, setModals] = useState<Array<{ id: number; content: string }>>([]);

    useRegister(modalBridge, 'modals', () => ({
        show: (content: string) => setModals(prev => [...prev, { id: Date.now(), content }]),
        hide: (id: number) => setModals(prev => prev.filter(m => m.id !== id))
    }), []);

    return (
        <>
            {modals.map(modal => (
                <Modal key={modal.id} content={modal.content} />
            ))}
        </>
    );
}

function AnyComponent() {
    const modals = useAPI(modalBridge, 'modals');

    const showModal = () => {
        if (modals.current) {
            modals.current.show('Hello from modal!');
        }
    };

    return <button onClick={showModal}>Show Modal</button>;
}
```

### Theme Provider

```tsx
const themeBridge = createBridge<{
    theme: {
        getCurrentTheme: () => string;
        toggleTheme: () => void;
        setTheme: (theme: string) => void;
    };
}>();

function ThemeProvider() {
    const [theme, setTheme] = useState('light');

    useRegister(themeBridge, 'theme', () => ({
        getCurrentTheme: () => theme,
        toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
        setTheme
    }), [theme]);

    return null;
}

function ThemeButton() {
    const themeAPI = useAPI(themeBridge, 'theme');

    return (
        <button onClick={() => themeAPI.current?.toggleTheme()}>
            Toggle Theme
        </button>
    );
}
```

## Best Practices

1. **Create bridges at module level** - Don't recreate bridges inside components
2. **Use TypeScript** - Define your API interfaces for better DX
3. **Handle undefined APIs** - Always check `apiRef.current` before using
4. **Use meaningful names** - API names should describe their purpose
5. **Keep APIs focused** - Don't create overly complex API objects
6. **Use onInit wisely** - Perfect for setting up event listeners or initial calls
7. **Pass bridge instance as first parameter** - All hooks and methods expect the bridge as the first argument

## Troubleshooting

**Q: My API is undefined even though the component is mounted**
- Check if components are in the same boundary
- Verify the API name matches exactly
- Ensure the registering component hasn't unmounted

**Q: API gets overwritten unexpectedly**
- By default, only one API per name exists
- Use `isMulti: true` for multiple instances
- Check for duplicate component mounts

**Q: TypeScript errors with API methods**
- Ensure your API implementation matches the interface
- Check that dependencies array includes all used variables

**Q: Bridge parameter missing**
- All hooks and methods require the bridge instance as the first parameter
- Make sure you're passing the bridge correctly: `useAPI(bridge, 'apiName')`

## API Reference

### Bridge Creation
- `createBridge<APIs, PayloadType>(globalPayload?, options?)` - Create a new bridge instance

### Hooks
- `useRegister(bridge, name, factory, deps, options?)` - Register an API
- `useAPI(bridge, name, options?)` - Access an API
- `useUpperAPI(bridge, name, options?)` - Access parent boundary API
- `useBoundaryPayload(bridge, options?)` - Get boundary payload
- `useUpperBoundaryPayload(bridge, options?)` - Get parent boundary payload
- `useBoundaryContext(bridge, payload?)` - Create context value for boundaries
- `useTools(bridge)` - Get programmatic access methods

### Methods
- `getBridgeAPI(bridge, name, options?)` - Global API access (outside components)
- `getBridgeAPIAsync(bridge, name, options?)` - Async API access

### Components
- `createBoundary(bridge)` - Create boundary component factory

## License

MIT