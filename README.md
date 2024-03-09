

# React-Awesome-Api-Bridge
React-Awesome-Api-Bridge is a store of action inside component.
Once api is registered, anywhere it will be available.
## Install
```
    npm install @ryo98/react-awesome-api-bridge
```
## Simple Usage
```
    import createBridge from '@ryo98/react-awesome-api-bridge';
        
    // create a bridge registry.
    const actionBridge = createBridge();
        
    function AComponent()   {
        const [count, setCount] = useState(0);
        
        // register the api named 'aAPI' by 'useRegister' hook.
        actionBridge.useRegister('aAPI', () => {
            // return the api
            return {
                getCount: () => count
            }
            
            // The third param is deps(optional).
        }, [count]);
        
         retrun <button onClick={() => setCount(count + 1)}>
            add
         </button>
    }
    
    function BComponent() {
        // To get the api, use 'useAPI' hook.
        const aComponentAPI = actionBridge.useAPI('aAPI');
        
        return <button onClick={() => {
            console.log(aComponentAPI.getCount?.());
        }}>show count of A </button>
    }
        
```


## Usage
```
    import createBridge from '@ryo98/react-awesome-api-bridge'
    
    // create a Bridge registry, and invoke its hooks in function
    // component 
    const actionBridge = createBridge();
    
    function AComponent()   {
        const [count, setCount] = useState(0);
        const addCount = () => {
            setCount((prev) => prev + 1);
        }
        // register the api of 'aComponent' by 'useRegister' hook.
        // Its arguments is like 'useImperative' hook, but first one is different, instead it's a value that can be used as a key in a object. 
        actionBridge.useRegister('namedA', () => {
            // return the 'api' that expected to be registered (stored) in the bridge.
            return {
                getCount: () => count,
                addCount
            }
            
            // The third param is deps(optional).
        }, [count]);
        
         retrun <button onClick={addCount}>
            add by self
         </button>
    }
    
    function BComponent() {
        // Use the 'useAPI' hook of 'actionBridge' to get the
        // actions of the registered with name of 'namedA'.  
        const aComponentAPI = actionBridge.useAPI('namedA');
        
        return <button onClick={aComponentAPI.addCount}>add count of A </button>
    }
    
    function CComponent(){
       
        // Note, 'useAPI' will always return a proxy, and it allow external context to key the properties of 'api', but if the 'api' is not a object-like value,
         use the 'const apiOriginal = raw(apiProxy)' to get the original intance of 'api'.
         . 
        const aComponentAPI = actionBridge.useAPI('namedA');
        
        return <button onClick={
            () => {
                // Note, there is using the  '?.' -- optional chaining operator, to prevent invoke an undefined value.
                // because the 'namedApi' may not have been registered, so the 'getCount' may undefined.
                
              
                console.log(aComponentAPI.getCount?.());
            }
        }> Show count of A</button>
    }
```

## Why
Sometime, we may occur this scenario, a component want to communicate with other component which is placed in somewhere the former is hard to pass information to the latter.Consider following React Trees:
```
    <!-- The latter is not a direct child component, so pass infomation by props is annoying -->
    <Former>
        <Immediate>
        ... other immdiate commponent's open tags
            <Latter/>
        ... other immediate commponent's close tags
        </Immediate>
    </Former>
```
```
<!-- 
The latter is under other tree node, 
and their common node is not the Former, 
instead is App, so Former may let App 
to proxy the process of passing information to the Latter,
but this behavior of proxy is also annoying.
  -->
    <App>
        <Former/>
        
        <Immediate>
            ... other immdiate commponent's open tags
            <Latter/>
            ... other immediate commponent's close tags
        </Immediate>
    </App>
```
The solution above is to use context,  third-party store lib or event bus.