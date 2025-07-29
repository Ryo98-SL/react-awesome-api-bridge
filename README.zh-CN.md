# react-api-bridge

> **语言版本**: [English](./README.md) | [简体中文](#)

一个用于在 React 组件之间共享命令式 API 而无需属性传递的库。在一个组件中注册 API，然后在组件树的任何地方访问它们。

<img src="./logo/react-api-bridge-logo.png" alt="Alt text" width="200"  height="auto">

## 为什么使用这个库？

- **无属性传递**：无需通过属性传递 refs，即可从任何地方访问组件 API
- **更好的性能**: API的更新不会导致冗余re-render
- **灵活的边界**：通过 Boundary 控制 API 作用域
- **类型安全**：完整的 TypeScript 支持，提供强类型的 API
- **支持多实例**：注册同一 API 的多个实例
- **异步获取**：通过 Promise 等待 API 注册完成

## 快速开始

### 安装

```bash
npm install @ryo-98/react-api-bridge
```

### 基础示例

```tsx
import { createBridge, useAPI, useRegister, getBridgeAPI } from '@ryo-98/react-api-bridge';

// 定义你的 API 类型
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

// 创建 Bridge
const bridge = createBridge<MyAPIs>();

// 注册 API 的组件
function Counter() {
    const [count, setCount] = useState(0);
    
    // 注册 API
    useRegister(bridge, 'counter', () => ({
        getCount: () => count,
        increment: () => setCount(c => c + 1)
    }), [count]);
    
    return <button onClick={() => setCount(count + 1)}>计数: {count}</button>;
}

// 使用 API 的组件（可以在树的任何地方！）
function CounterDisplay() {
    const counterAPI = useAPI(bridge, 'counter');
    
    const showCount = () => {
        if (counterAPI.current) {
            alert(`当前计数: ${counterAPI.current.getCount()}`);
        }
    };
    
    return <button onClick={showCount}>显示计数</button>;
}

// 在组件外部访问 API
function GlobalAccess() {
    const handleClick = () => {
        const counterAPI = getBridgeAPI(bridge, 'counter');
        if (counterAPI.current) {
            counterAPI.current.increment();
        }
    };
    
    return <button onClick={handleClick}>从外部增加</button>;
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

## 核心概念

### 1. 创建 Bridge

```tsx
// 带 TypeScript 的基础 Bridge
interface MyAPIs {
    counter: { increment: () => void };
    user: { getName: () => string };
}

const bridge = createBridge<MyAPIs>();

// 带有全局载荷的 Bridge
const bridge = createBridge<MyAPIs, { theme: string }>({ theme: 'dark' });

// 带有 API 选项的 Bridge
const bridge = createBridge<MyAPIs>()({
    counter: { isMulti: true } // 允许多个实例
});
```

### 2. 注册 API

使用 `useRegister` 让组件方法对其他组件可用：

```tsx
function MyComponent({ name }: { name: string }) {
    const [value, setValue] = useState('');
    
    useRegister(bridge, 'myAPI', () => ({
        getValue: () => value,
        setValue: (newValue: string) => setValue(newValue),
        getName: () => name
    }), [value, name]); // 依赖项类似于 useEffect
    
    return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

### 3. 使用 API

通过 `useAPI` 访问注册的 API：

```tsx
function ConsumerComponent() {
    const myAPI = useAPI(bridge, 'myAPI', {
        // 可选：API 首次可用时的回调
        onInit: (apiRef) => {
            console.log('API 已准备就绪:', apiRef.current?.getValue());
            
            // 如果需要，返回清理函数
            return () => console.log('正在清理');
        }
    });
    
    const handleClick = () => {
        if (myAPI.current) {
            myAPI.current.setValue('来自消费者的问候！');
        }
    };
    
    return <button onClick={handleClick}>更新值</button>;
}
```

## Boundary

Boundary 控制哪些组件可以访问哪些 API。可以将它们视为作用域。

### 基本 Boundary 用法

```tsx
import { createBoundary } from '@ryo-98/react-api-bridge';

const Boundary = createBoundary(bridge);

function App() {
    return (
        <div>
            <MyComponent name="global" /> {/* 全局作用域 */}
            
            <Boundary>
                <MyComponent name="scoped" /> {/* Boundary 作用域 */}
                <ConsumerComponent /> {/* 只能看到 "scoped" API */}
            </Boundary>
            
            <ConsumerComponent /> {/* 只能看到 "global" API */}
        </div>
    );
}
```

### Boundary Payload

向 Boundary 内的所有组件传递数据：

```tsx
function App() {
    return (
        // 你可以用 useMemo 包装这个对象来防止不必要的重新渲染   
        <Boundary payload={{ theme: 'dark', user: 'john' }}> 
            <MyComponent />
        </Boundary>
    );
}

function MyComponent() {
    const payload = useBoundaryPayload(bridge);
    console.log(payload); // { theme: 'dark', user: 'john' }
}
// 或者可以在创建bridge时指定默认的payload
const bridge = createBridge({ theme: 'dark', user: 'global' })
```

### 连接 Boundary

在 Boundary 之间共享上下文：

```tsx
function App() {
    const contextValue = useBoundaryContext(bridge, { shared: 'data' });
    
    // 这里会注册API到使用相同contextValue的Boundary上
    useRegister(bridge, "someAPI", { contextValue });

    // 这里会获取到使用相同contextValue的Boundary的API
    const someAPI = useAPI(bridge, "someAPI", {contextValue});

    return (
        <div>
            <Boundary contextValue={contextValue}>
                <ComponentA />
            </Boundary>
            
            {/* 这个 Boundary 共享相同的上下文 */}
            <Boundary contextValue={contextValue}>
                <ComponentB /> {/* 可以看到 ComponentA 的 API，以及上面注册的“someAPI” */}
            </Boundary>
        </div>
    );
}
```

## 高级功能

### 访问父 Boundary

使用 `useUpperAPI` 访问父 Boundary 的 API：

```tsx
function NestedComponent() {
    const currentAPI = useAPI(bridge, 'myAPI');      // 当前 Boundary
    const parentAPI = useUpperAPI(bridge, 'myAPI'); // 父 Boundary
    
    const rootAPI = useUpperAPI(bridge, 'myAPI', {
        // 通过条件查找特定 Boundary
        shouldForwardYield: (boundary) => !boundary.parent // 根 Boundary
    });
}
```

### 异步 API 访问

等待 API 注册完成：

```tsx
import { getBridgeAPIAsync, useTools } from '@ryo-98/react-api-bridge';

// 在组件外部
getBridgeAPIAsync(bridge, 'myAPI')
    .then(apiRef => {
        console.log('API 已准备就绪:', apiRef.current?.getValue());
    });

// 在组件内部
function MyComponent() {
    const { getAPIAsync } = useTools(bridge);
    
    useEffect(() => {
        getAPIAsync('myAPI').then(apiRef => {
            // API 现在可用
        });
    }, []);
}
```

### 多 API 实例

允许多个组件注册相同的 API 名称：

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
    const notificationAPIs = useAPI(bridge, 'notifications'); // API 数组
    
    const showAll = () => {
        notificationAPIs.forEach(api => {
            if (api.current?.id === 'foo') {
                console.log('foo!');
            }
            api.current?.showNotification('你好！');
        });
    };
    
    return <button onClick={showAll}>显示所有通知</button>;
}
```

### 工具钩子

以编程方式访问 Bridge 功能：

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
        // 不使用钩子来使用 API
    };
}
```

## TypeScript 支持

定义强类型的 API：

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

// 现在一切都有类型了！
function MyComponent() {
    useRegister(bridge, 'counter', () => ({
        getCount: () => 42,
        increment: () => console.log('increment')
        // TypeScript 将强制执行这与接口匹配
    }), []);
    
    const counterAPI = useAPI(bridge, 'counter'); // 完全类型化
    const payload = useBoundaryPayload(bridge); // PayloadType
}
```

## 常见模式

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
            modals.current.show('来自模态框的问候！');
        }
    };
    
    return <button onClick={showModal}>显示模态框</button>;
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
            切换主题
        </button>
    );
}
```

## 最佳实践

1. **在顶级作用域创建 Bridge** - 不要在组件内部重新创建 Bridge
2. **使用 TypeScript** - 定义你的 API 接口以获得更好的开发体验
3. **处理未定义的 API** - 使用前始终检查 `apiRef.current`
4. **使用有意义的名称** - API 名称应该描述其用途
5. **保持 API 专注** - 不要创建过于复杂的 API 对象
6. **明智地使用 onInit** - 非常适合设置事件监听器或初始调用
7. **将 Bridge 实例作为第一个参数传递** - 所有钩子和方法都期望 Bridge 作为第一个参数

## 故障排除

**问：即使组件已挂载，我的 API 仍然未定义**
- 检查组件是否在同一个 Boundary 中
- 验证 API 名称是否完全匹配
- 确保注册组件没有卸载

**问：API 意外被覆盖**
- 默认情况下，每个名称只存在一个 API
- 对多个实例使用 `isMulti: true`
- 检查重复的组件挂载

**问：API 方法的 TypeScript 错误**
- 确保你的 API 实现与接口匹配
- 检查依赖项数组包含所有使用的变量

**问：缺少 Bridge 参数**
- 所有钩子和方法都需要 Bridge 实例作为第一个参数
- 确保你正确传递 Bridge：`useAPI(bridge, 'apiName')`

## API 参考

### Bridge 创建
- `createBridge<APIs, PayloadType>(globalPayload?, options?)` - 创建新的 Bridge 实例

### 钩子
- `useRegister(bridge, name, factory, deps, options?)` - 注册 API
- `useAPI(bridge, name, options?)` - 访问 API
- `useUpperAPI(bridge, name, options?)` - 访问父 Boundary API
- `useBoundaryPayload(bridge, options?)` - 获取 Boundary payload
- `useUpperBoundaryPayload(bridge, options?)` - 获取父 Boundary payload
- `useBoundaryContext(bridge, payload?)` - 为 Boundary 创建上下文值
- `useTools(bridge, options?)` - 获取编程访问方法

### 方法
- `getBridgeAPI(bridge, name, options?)` - API 访问（在组件外部），默认访问全局API
- `getBridgeAPIAsync(bridge, name, options?)` - 异步 API 访问，默认访问全局API

### 组件
- `createBoundary(bridge)` - 创建 Boundary 组件工厂

## 许可证

MIT