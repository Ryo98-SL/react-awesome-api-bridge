# react-api-bridge

> **语言版本**: [English](./README.md) | [简体中文](#)

一个用于在 React 组件之间共享命令式 API 而无需属性传递的库。在一个组件中注册 API，然后在组件树的任何地方访问它们。

<img src="./logo/react-api-bridge-logo.png" alt="Alt text" width="100%" style="object-fit: contain"  height="200">

## 为什么使用这个库？

- **无属性传递**：无需通过属性传递 refs，即可从任何地方访问组件 API
- **更好的性能**: API的更新不会导致冗余re-render
- **灵活的边界**：通过边界控制 API 作用域
- **类型安全**：完整的 TypeScript 支持，提供强类型的 API
- **支持多实例**：注册同一 API 的多个实例
- **异步获取**：通过 Promise 等待 API 注册完成

## 快速开始

### 安装

```bash
npm install @ryo-98/react-api-bridge
```

### 基础示例

```jsx
import createBridge from '@ryo-98/react-api-bridge';

// 创建Bridge注册中心
const bridge = createBridge();

// 注册 API 的组件
function Counter() {
  const [count, setCount] = useState(0);
  
  // 注册 API
  bridge.useRegister('counter', () => ({
    getCount: () => count,
    increment: () => setCount(c => c + 1)
  }), [count]);
  
  return <button onClick={() => setCount(count + 1)}>计数: {count}</button>;
}

// 使用 API 的组件（可以在树的任何地方！）
function CounterDisplay() {
  const counterAPI = bridge.useAPI('counter');
  
  const showCount = () => {
    if (counterAPI.current) {
      alert(`当前计数: ${counterAPI.current.getCount()}`);
    }
  };
  
  return <button onClick={showCount}>显示计数</button>;
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

## 核心概念

### 1. 创建Bridge

```jsx
// 基础Bridge
const bridge = createBridge();

// 带有全局载荷的Bridge
const bridge = createBridge('global-data');

// 带有 API 选项的Bridge
const bridge = createBridge()({
  myAPI: { isMulti: true } // 允许多个实例
});
```

### 2. 注册 API

使用 `useRegister` 让组件方法对其他组件可用：

```jsx
function MyComponent({ name }) {
  const [value, setValue] = useState('');
  
  bridge.useRegister('myAPI', () => ({
    getValue: () => value,
    setValue: (newValue) => setValue(newValue),
    getName: () => name
  }), [value, name]); // 依赖项类似于 useEffect
  
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

### 3. 使用 API

通过 `useAPI` 访问注册的 API：

```jsx
function ConsumerComponent() {
  const myAPI = bridge.useAPI('myAPI', {
    // 可选：API 首次可用时的回调
    onInit: (apiRef) => {
      console.log('API 已准备就绪:', apiRef.current.getValue());
      
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

## 边界

边界控制哪些组件可以访问哪些 API。可以将它们视为作用域。

### 基本边界用法

```jsx
function App() {
  return (
    <div>
      <MyComponent name="global" /> {/* 全局作用域 */}
      
      <bridge.Boundary>
        <MyComponent name="scoped" /> {/* 边界作用域 */}
        <ConsumerComponent /> {/* 只能看到 "scoped" API */}
      </bridge.Boundary>
      
      <ConsumerComponent /> {/* 只能看到 "global" API */}
    </div>
  );
}
```

### 边界载荷

向边界内的所有组件传递数据：

```jsx
function App() {
  return (
    // 你可以用 useMemo 包装这个对象来防止不必要的重新渲染   
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

### 连接边界

在边界之间共享上下文：

```jsx
function App() {
  const contextValue = bridge.useContextValue({ shared: 'data' });
  
  return (
    <div>
      <bridge.Boundary contextValue={contextValue}>
        <ComponentA />
      </bridge.Boundary>
      
      {/* 这个边界共享相同的上下文 */}
      <bridge.Boundary contextValue={contextValue}>
        <ComponentB /> {/* 可以看到 ComponentA 的 API */}
      </bridge.Boundary>
    </div>
  );
}
```

## 高级功能

### 访问父边界

使用 `useUpperAPI` 访问父边界的 API：

```jsx
function NestedComponent() {
  const currentAPI = bridge.useAPI('myAPI');      // 当前边界
  const parentAPI = bridge.useUpperAPI('myAPI'); // 父边界
  
  const rootAPI = bridge.useUpperAPI('myAPI', {
    // 通过条件查找特定边界
    shouldForwardYield: (boundary) => !boundary.parent // 根边界
  });
}
```

### 异步 API 访问

等待 API 注册完成：

```jsx
// 在组件外部
bridge.getAPIAsync('myAPI')
  .then(apiRef => {
    console.log('API 已准备就绪:', apiRef.current.getValue());
  });

// 在组件内部
function MyComponent() {
  const { getAPIAsync } = bridge.useTools();
  
  useEffect(() => {
    getAPIAsync('myAPI').then(apiRef => {
      // API 现在可用
    });
  }, []);
}
```

### 多 API 实例

允许多个组件注册相同的 API 名称：

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
  const notificationAPIs = bridge.useAPI('notifications'); // API 数组
  
  const showAll = () => {
    notificationAPIs.forEach(api => {
      if(api.current.id === 'foo') {
          console.log('foo!')
      }  
      api.current.showNotification('你好！');
    });
  };
}
```

### 工具钩子

以编程方式访问Bridge功能：

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
  bridge.useRegister('counter', () => ({
    getCount: () => 42,
    increment: () => console.log('increment')
    // TypeScript 将强制执行这与接口匹配
  }));
  
  const counterAPI = bridge.useAPI('counter'); // 完全类型化
  const payload = bridge.useBoundaryPayload(); // PayloadType
}
```

## 常见模式

### 模态框管理器

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
      modals.current.show('来自模态框的问候！');
    }
  };
}
```

### 主题更改

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
      切换主题
    </button>
  );
}
```

## 最佳实践

1. **在模块级别创建Bridge** - 不要在组件内部重新创建Bridge
2. **使用 TypeScript** - 定义你的 API 接口以获得更好的开发体验
3. **处理未定义的 API** - 使用前始终检查 `apiRef.current`
4. **使用有意义的名称** - API 名称应该描述其用途
5. **保持 API 专注** - 不要创建过于复杂的 API 对象
6. **明智地使用 onInit** - 非常适合设置事件监听器或初始调用

## 故障排除

**问：即使组件已挂载，我的 API 仍然未定义**
- 检查组件是否在同一个边界中
- 验证 API 名称是否完全匹配
- 确保注册组件没有卸载

**问：API 意外被覆盖**
- 默认情况下，每个名称只存在一个 API
- 对多个实例使用 `isMulti: true`
- 检查重复的组件挂载

**问：API 方法的 TypeScript 错误**
- 确保你的 API 实现与接口匹配
- 检查依赖项数组包含所有使用的变量

## API 参考

### Bridge方法
- `useRegister(name, factory, deps)` - 注册 API
- `useAPI(name, options?)` - 访问 API
- `useUpperAPI(name, options?)` - 访问父边界 API
- `useBoundaryPayload(options?)` - 获取边界载荷
- `useUpperBoundaryPayload(options?)` - 获取父边界载荷
- `useTools()` - 获取编程访问方法
- `useContextValue(payload?)` - 为边界创建上下文值
- `getBridgeAPI(name)` - 全局 API 访问（在组件外部）
- `getAPIAsync(name, options?)` - 异步 API 访问

### 组件
- `<Boundary>` - 创建 API 作用域边界

## 许可证

MIT