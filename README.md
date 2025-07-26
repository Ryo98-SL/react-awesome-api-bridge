# react-api-bridge
> **Language**: [English](#) | [简体中文](./README.zh-CN.md)

A React library for sharing imperative APIs between components without prop drilling. Register APIs in one component and access them anywhere in your component tree.

<img src="./logo/react-api-bridge-logo.png" alt="Alt text" width="100%" style="object-fit: contain"  height="200">

## Why Use This?

- **No Prop Drilling**: Access component APIs from anywhere without passing refs through props
- **Better Performance**: Update APIs won't result in redundant re-render
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

```jsx
import createBridge from '@ryo-98/react-api-bridge';

// Create a bridge registry
const bridge = createBridge();

// Component that registers an API
function Counter() {
    const [count, setCount] = useState(0);

    // Register the API
    bridge.useRegister('counter', () => ({
        getCount: () => count,
        increment: () => setCount(c => c + 1)
    }), [count]);

    return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

// Component that uses the API (can be anywhere in the tree!)
function CounterDisplay() {
    const counterAPI = bridge.useAPI('counter');

    const showCount = () => {
        if (counterAPI.current) {
            alert(`Current count: ${counterAPI.current.getCount()}`);
        }
    };

    return <button onClick={showCount}>Show Count</button>;
}

function App() {
    return (
        <div>
            <Counter />
            <CounterDisplay />
        </div>
    );
}
```

## Core Concepts

### 1. Bridge Creation

```jsx
// Basic bridge
const bridge = createBridge();

// Bridge with global payload
const bridge = createBridge('global-data');

// Bridge with API options
const bridge = createBridge()({
    myAPI: { isMulti: true } // Allow multiple instances
});
```

### 2. Registering APIs

Use `useRegister` to make component methods available to other components:

```jsx
function MyComponent({ name }) {
    const [value, setValue] = useState('');

    bridge.useRegister('myAPI', () => ({
        getValue: () => value,
        setValue: (newValue) => setValue(newValue),
        getName: () => name
    }), [value, name]); // Dependencies like useEffect

    return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

### 3. Using APIs

Access registered APIs with `useAPI`:

```jsx
function ConsumerComponent() {
    const myAPI = bridge.useAPI('myAPI', {
        // Optional: callback when API first becomes available
        onInit: (apiRef) => {
            console.log('API ready:', apiRef.current.getValue());

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

```jsx
function App() {
    return (
        <div>
            <MyComponent name="global" /> {/* Global scope */}

            <bridge.Boundary>
                <MyComponent name="scoped" /> {/* Boundary scope */}
                <ConsumerComponent /> {/* Can only see "scoped" API */}
            </bridge.Boundary>

            <ConsumerComponent /> {/* Can only see "global" API */}
        </div>
    );
}
```

### Boundary Payloads

Pass data to all components within a boundary:

```jsx
function App() {
    return (
        // You can wrap this object with useMemo to prevent redundant re-render   
        <bridge.Boundary payload={{ theme: 'dark', user: 'john' }}>
            <MyComponent />
        </bridge.Boundary>
    );
}

function MyComponent() {
    const payload = bridge.useBoundaryPayload();
    console.log(payload); // { theme: 'dark', user: 'john' }
}
```

### Connecting Boundaries

Share context between boundaries:

```jsx
function App() {
    const contextValue = bridge.useContextValue({ shared: 'data' });

    return (
        <div>
            <bridge.Boundary contextValue={contextValue}>
                <ComponentA />
            </bridge.Boundary>

            {/* This boundary shares the same context */}
            <bridge.Boundary contextValue={contextValue}>
                <ComponentB /> {/* Can see ComponentA's APIs */}
            </bridge.Boundary>
        </div>
    );
}
```

## Advanced Features

### Accessing Parent Boundaries

Use `useUpperAPI` to access APIs from parent boundaries:

```jsx
function NestedComponent() {
    const currentAPI = bridge.useAPI('myAPI');      // Current boundary
    const parentAPI = bridge.useUpperAPI('myAPI'); // Parent boundary

    const rootAPI = bridge.useUpperAPI('myAPI', {
        // Find specific boundary by condition
        shouldForwardYield: (boundary) => !boundary.parent // Root boundary
    });
}
```

### Async API Access

Wait for APIs to be registered:

```jsx
// Outside components
bridge.getAPIAsync('myAPI')
    .then(apiRef => {
        console.log('API ready:', apiRef.current.getValue());
    });

// Inside components
function MyComponent() {
    const { getAPIAsync } = bridge.useTools();

    useEffect(() => {
        getAPIAsync('myAPI').then(apiRef => {
            // API is now available
        });
    }, []);
}
```

### Multiple API Instances

Allow multiple components to register the same API name:

```jsx
const bridge = createBridge()({
    notifications: { isMulti: true }
});

function NotificationProvider({ type, id }) {
    bridge.useRegister('notifications', () => ({
        id,
        showNotification: (msg) => console.log(`${type}: ${msg}`)
    }));
}

function App() {
    return (
        <div>
            <NotificationProvider id={'foo'} type="success" />
            <NotificationProvider id={'bar'} type="error" />
            <NotificationConsumer id={'baz'} />
        </div>
    );
}

function NotificationConsumer() {
    const notificationAPIs = bridge.useAPI('notifications'); // Array of APIs

    const showAll = () => {
        notificationAPIs.forEach(api => {
            if(api.current.id === 'foo') {
                console.log('foo!')
            }
            api.current.showNotification('Hello!');
        });
    };
}
```

### Tool Hooks

Access bridge functionality programmatically:

```jsx
function MyComponent() {
    const {
        getBridgeAPI,
        getBoundaryPayload,
        getUpperAPI,
        getUpperBoundaryPayload,
        getAPIAsync
    } = bridge.useTools();

    const handleClick = () => {
        const api = getBridgeAPI('myAPI');
        const payload = getBoundaryPayload();
        // Use APIs without features
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
    bridge.useRegister('counter', () => ({
        getCount: () => 42,
        increment: () => console.log('increment')
        // TypeScript will enforce this matches the interface
    }));

    const counterAPI = bridge.useAPI('counter'); // Fully typed
    const payload = bridge.useBoundaryPayload(); // PayloadType
}
```

## Common Patterns

### Modal Manager

```jsx
const modalBridge = createBridge();

function ModalManager() {
    const [modals, setModals] = useState([]);

    modalBridge.useRegister('modals', () => ({
        show: (content) => setModals(prev => [...prev, { id: Date.now(), content }]),
        hide: (id) => setModals(prev => prev.filter(m => m.id !== id))
    }), []);

    return modals.map(modal => (
        <Modal key={modal.id} content={modal.content} />
    ));
}

function AnyComponent() {
    const modals = modalBridge.useAPI('modals');

    const showModal = () => {
        if (modals.current) {
            modals.current.show('Hello from modal!');
        }
    };
}
```

### Theme Provider

```jsx
const themeBridge = createBridge();

function ThemeProvider() {
    const [theme, setTheme] = useState('light');

    themeBridge.useRegister('theme', () => ({
        getCurrentTheme: () => theme,
        toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
        setTheme
    }), [theme]);
}

function ThemeButton() {
    const themeAPI = themeBridge.useAPI('theme');

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

## API Reference

### Bridge Methods
- `useRegister(name, factory, deps)` - Register an API
- `useAPI(name, options?)` - Access an API
- `useUpperAPI(name, options?)` - Access parent boundary API
- `useBoundaryPayload(options?)` - Get boundary payload
- `useUpperBoundaryPayload(options?)` - Get parent boundary payload
- `useTools()` - Get programmatic access methods
- `useContextValue(payload?)` - Create context value for boundaries
- `getBridgeAPI(name)` - Global API access (outside components)
- `getAPIAsync(name, options?)` - Async API access

### Components
- `<Boundary>` - Create API scope boundary

## License

MIT