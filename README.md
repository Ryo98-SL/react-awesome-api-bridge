

# react-api-bridge
react-api-bridge is aim to build a registry for imperative api in **_react_** based app.
Once api is registered, it will be available anywhere in Function Component.
## Install
```shell
  npm install @ryo-98/react-api-bridge
```
## Simple Usage
```jsx
    import createBridge from '@ryo-98/react-api-bridge';
        
    // create a bridge registry.
    const actionBridge = createBridge();
        
    function A()   {
        const [count, setCount] = useState(0);
        
        // register the api named 'aAPI' by 'useRegister' hook. the params of last two ones is same as 'useImperativeHandle'
        actionBridge.useRegister('aAPI', () => {
        
            // return the api
            return {
                getCount: () => count
            }
            
            // The third param is deps(optional).
        }, [count]);
        
         return <button onClick={() => setCount(count + 1)}>
            add
         </button>
    }
    
    function B() {
        // To get the api, use 'useAPI' hook.
        const aComponentAPI = actionBridge.useAPI('aAPI');
        
        return <button onClick={() => {
            console.log(aComponentAPI.current?.getCount());
        }}>show count of A </button>
    }
        
```

## useRegister and useAPI

The useRegister hook is to register the api for bridge it belong to, and then use the correspond useAPI hook to get the registered ref object of api .

```tsx
// create Bridge in the top-level scope
import {useEffect} from "react";

const Bridge1 = createBridge();

// you can create multiple bridges to sparate namespaces for api.
const Bridge2 = createBridge();

function A() {
    const [name, setName] = useState('123');
    Bridge1.useRegister(
        'name',    //fist param is the name of the api, can regard as the id of the api
        () => { // second param is a function that should return the api 
            return {
                getName: () => name,
                setName: () => setName(name)
            }
        },
        [name] // third param is deps for updating the api
        // there has optional fourth param, will explain in a later section
    )

    // Technically you can get the api ref, in the same component context,
    // but most of time, it's worth nothing
    const nameAPI = Bridge.useAPI('name');

    //The useRegister is allow to use multiple times in the same component context.
    // register other api named 'pop'
    Bridge1.useRegister('pop', () => {
        return {
            // some perporties
        }
    });
    
    return //... some jsx
}

function B() {
    //There using useAPI hook to get the ref object of api named 'name' which was registered in the A component.
    const nameAPI = Bridge1.useAPI(
        'name',  
        // the second optional argument is an option object
        {
            // this method is able to listen the first completion of regsiter, and the regsitered api ref object is passed as its first argument, then return a clear function if there has some effects need to be cleared in this function.
        onInit(api) {
            console.log('name initialized',  api.current.getName());
            const handler =  () => {
                console.log('name: ', api.current.getName());
            };
            
            document.addEventListener('click',handler)
            return () => {
                // clear effect
                document.removeEventListener('click', )
            }
        }
    });

    const handleClick = () => {
        // There determine whether current is not undefined, 
        // because the api is not guarant have been registered
        if(nameAPI.current) {
            console.log(nameAPI.current.getName())
        }
    }
    
    return <button onClick={handleClick}>
        print name of A 
    </button>
}

```
After reading code above, there come a question:

Why need determine current value ?

From the code above,We know the register operation of 'name' api is only  in the A component, and because A may not mount in the app, so whenever B is need to use 'name' api that the A component should register, it may just get undefined value from 'current' property due to the absence of the A component.

There have some points to note:

+ if a component's body have useRegister hooks and mount multiple times, the registered instance of api is the last mount one, because every time the useRegister is executed, it will overwrite the api in terms of name argument(the first parameter).

+ When api of useRegister updated due to the deps, the correspond useAPI hook will not cause component that it reside in re-render, because useRegister update the property 'current' value of the api ref object.


## Boundary

The boundary is used to constrain communication among components and create a new registry to receive registered api, only components that in the same boundary context can do such. By default, if there is no boundary above a component in an element tree, it is in the global boundary implicitly.

```tsx
    const Bridge1 = createBridge();
    
    function APP() {
        return <>
             <A/> // It is 'awarable' for component that in the global boundary.
             <Bridge1.Boundary>
                <B/> //the outer A is 'unawarable' for B, expect C and the inner one A , because C is in the same boundary with B
                <C/>
                <A/>
            </Bridge1.Boundary>
    </>
    }

```
Note different bridges are independent, their boundary is unable to perceive for others.

    
## Associate with Boundaries or Hooks
Boundary can receive a 'contextValue' prop to associate with other boundaries or hooks.

```tsx
import createBridge from "@ryo-98/react-api-bridge";

const Bridge1 = createBridge();

function APP() {
    const contextValue = Bridge1.useContextValue();
    Bridge1.useRegister(
        'root',
        () => {
            return {
                // some methods
            }
        },
        {
            // here pass the contextValue, boundary can associate with the hook, 
            // otherwise the api of 'root' will register in the upper boundary(In this case, it will be global boundary).
            contextValue
        });
    
    return <>
        <Bridge1.Boundary contextValue={contextValue}>
            <A/>
            <B/>
        </Bridge1.Boundary>
        
        {/* Associate with other boundary: */}
        {/* Pass the contextValue for  subsequent one that is the boundary of Bridge1  */}
        <Bridge1.Boundary contextValue={contextValue}>
            <C /> {/* C is as if in the same boundary as A and B. */}
        </Bridge1.Boundary>
    </>
}
```
## Boundary Payload
Boundary can receive a prop named 'payload', it has same effect as the 'value' prop of Context.Provide, then the components within the Boundary can get the payload by specific hooks.

```tsx
import createBridge from "@ryo-98/react-api-bridge";
// pass the default value of global boundary
const Bridge1 = createBridge("1");

function APP() {
    // Value is "1", because it within the global boundary.
    const payload = Bridge1.useBoundaryPayload();

    // create a bridge contextValue, and pass the value "2" as
    // payload value of associated boundaries.
    const contextValue = Bridge1.useContextValue("2");
    // Value is "2", because it is associated by passing a contextValue,
    // and the payload is "2".
    const payload2 = Bridge1.useBoundaryPayload({contextValue});
    
    return <>
        {/* Will print "1" */}
        <A/>
        
        <Bridge1.Boundary payload={"3"}>
        {/* Will print "3"   */}
            <A/>
        </Bridge1.Boundary>

        {/*
            if the payload and contextValue are both passed,
            the 'payload' prop will be ignore.
         */}
        <Bridge1.Boundary contextValue={contextValue}
                          payload={"3"}>
            {/*  Will print "2"  */}
            <A/>
        </Bridge1.Boundary>
    </>
}

function A() {
    const payload = Bridge1.useBoundaryPayload();
    console.log(payload);
    return <></>
}


```

## useUpperAPI and useUpperBoundaryPayload

These hooks are able to traverse the boundaries above, and forward a specific boundary's api and payload respectively.

```tsx
// the first argument is payload of global boundary.
const Bridge = createBridge('hello');

function A(props) {
    Bridge.useRegister('msg', () => {
        return {
            getMessage: () => props.message
        }
    }, [props.message]);
    return // some jsx
}

function B() {
    const nameAPI = Bridge.useAPI('msg');

    const wrapperNameAPI = Bridge.useUpperAPI('msg');

    const mainNameAPI = Bridge.useUpperAPI('msg', {
        shouldForwardYield(boundary) {
            return boundary.payload === 'main'
        }
    });

    const globalNameAPI = Bridge.useUpperAPI('msg', {
        shouldForwardYield(boundary) {
            return !boundary.parent;
        }
    });

    // will be 'hello'
    const globalPayload = Bridge.useUpperBoundaryPayload({
        shouldForwardYield(boundary) {
            return !boundary.parent;
        }
    })

    const handleClick = () => {
        // print 'baz'
        console.log(nameAPI.current?.getName())
        // print 'foo'
        console.log(wrapperNameAPI.current?.getName())
        // print 'bar'
        console.log(mainNameAPI.current?.getName())
        // print 'pop'
        console.log(globalNameAPI.current?.getName())
    }

    return <button onClick={handleClick}>
        get names
    </button>
}

// There is the hierarchy
function APP() {

    return <>
        <A message={'pop'}></A>
        <Bridge.Boundary payload={'main'}>
            <A message={'bar'}/>
            <Bridge.Boundary>
                <A message={'foo'}/>
                <Bridge.Boundary>
                    <A message={'baz'}/>
                    <B/>
                </Bridge.Boundary>
            </Bridge.Boundary>
        </Bridge.Boundary>
    </>
}
```

From the code above, the component B is using four hooks to get api named 'msg' in different boundary, the A component will receive a 'msg' prop, then register an api named 'msg'.

here will explain how each hook in the B component is working.

1. useAPI, will look for an api named 'msg' in its boundary, and a component named 'A' with a prop valued 'baz' is under the same boundary with B, and A registered the api named 'msg' is just what B's useAPI is looking for.So the getMessage method of ref object returned by useAPI will return 'baz'.


2. The useUpperAPI, is looking for an api named 'msg' on the one layer higher boundary of its current boundary, and on that layer boundary ,because a component named 'A' is register an api named 'msg', so the getMessage method of ref object returned by useUpperAPI will return 'foo'.


3. The second useUpperAPI is passed an object type option argument, and that object have a method shouldForwardYield, and this method is to determine the boundary where the api should look for, the method hava a single argument which is a detail of current iterating boundary, and need return a value to determine if yield forward iteration, truly value means yield, otherwise keep going. the code snippet: 
    ```ts
        return boundary.payload === 'main';
    ```
   means the api will look up in the boundary which have a payload valued 'main', it does have a boundary with this payload, and there have a component A register an api is what this useUpperAPI hook need. So the correspond getMessage method will return 'bar'.
 

4. The third useUpperAPI also have a shouldForwardYield method on its option argument, but intend to look for an api in the boundary which have no parent, because only global boundary not have  parent boundary itself, so in this case, it gets the api registered at most outer component A, and so the correspond getMessage method will return 'pop'.

Besides useAPI and useUpperAPI, the example also show a usage of the useUpperBoundaryPayload and its accept a same option object with useUpperAPI, it will get the payload of global boundary because its shouldForwardField is same as the last useUpperAPI used. Global payload can only be specified in the bridge creation, by passing first argument to createBridge.

## Hook Counterparts
The hooks noticed above have their own normal version counterpart respectively:
```tsx
    function A() {
    const {
        getAPI, // a counterpart for useAPI
        getBoundaryPayload, //  useBoundaryPayload
        getUpperAPI, // useUpperAPI
        getUpperBoundaryPayload, // useUpperBoundaryPayload
    } = Bridge.useTools();
    const api = Bridge.useAPI('someone');
    
    const show = () => {
        // the hook way
        console.log(api.current.getName())
        // here is the equivalent version
        console.log(getAPI('someone').current.getName());
    }
    
    return //some jsx
}
```

There also have a global version for useAPI,and not be required to use into function component.

```tsx
const Bridge = createBridge();
// will get api named 'msg' from global boundary
const msgAPI = Bridge.getAPI('msg');
const thirdPartyBtn = document.querySelector('#mui-btn');

thirdPartyBtn.addEventListener('click', () => {
    if(msgAPI.current) {
        // will print 'baz'
        console.log(msgAPI.current());
    }
})

function A(props) {
    Bridge.useRegister('msg', () => {
        return () => props.message
    }, [props.message])
}

function APP() {
    
    return <>
        <A message={'baz'}/>
        <Bridge.Boundary>
            <A message={'bar'}/>
        </Bridge.Boundary>
        </>
}


```

## Multiple API
The useRegister hook normally will only register singleton api instance, if there have been assigned value on the 'current' property of
correspond ref object, it will overwrite with own value, this behaviour can switch to the new api will append to an array, and the array is containing api objects that have been registered.

The following code will show you how to switch this behaviour on:

```tsx
import Bridge from "./bridge";

const Bridge = createBridge('pop')({ // invoke the function returned by createBridge, and pass an option object
    // it means api named 'msg' will use the 'mutilple' mode
    msg: {isMulti: true}
})

function A(props) {
    Bridge.useRegister('msg', () => {
        return {
            getMessage: () => props.message
        }
    }, [props.message]);

    Bridge.useRegister('evt', () => {
        return {
            show: () => console.log(props.evt)
        }
    }, [props.evt]);

    return // some jsx
}

function B() {
    Bridge.useRegister('msg', () => {
        return {
            getMessage: () => 'b-message'
        }
    });

}

function APP() {
    const msgAPIList = Bridge.useAPI('msg');
    const evtAPI = Bridge.useAPI('evt');
    
    const handle = () => {
        msgAPIList.forEach((api) => {
            // will print 'baz' 'bar' 'b-message'
            console.log(api.current.getMessage());
        })

        // only print 'c1'
        evtAPI.current.show();
    }

    return <>
        <A message={'baz'} evt={'r1'}/>
        <A message={'bar'} evt={'c1'}/>
        <B/>
        <button onClick={handle}>click me</button>
    </>
}


```


## Troubleshooting

+ Why the api registered in a component not work even that component is mounting:
  + The component that registered the api may mount multiple times,but you may operate the last mounted instance of api, not the first one you may expect. 

    ```tsx
    <>
          <RegisterAPI /> 
         {/* will overwrite the previous api whenever showSecond is truly */}
         {
            showSecond && 
            <RegisterAPI /> 
         }
    </>
    ```
  
   + The component that registered the api, have a different boundary with the usage of api
      ```tsx
      <>
         <SomeBridge.Boundary>
             <RegisterAPI /> 
         </SomeBridge.Boundary>
         {/* Will not able to get api that RegisterAPI component which is mounting above registered because their boundary is different */}
         <UsageOfAPI /> 
     
       </>
      ```




## Typescript
The createBridge support two generic parameter.

+ The first generic parameter is the type for api, it should be given an object-like type as outer, but type of members are not constrained.
+ The second generic parameter is the payload type for global boundary, its optional, it will use undefined type by default.

```tsx
// a common practice
const Bridge = createBridge<
    {
        msg: {
            getMessage: () => string,
        }
    },
    string
>('pop')();

```

```tsx
// the member type of msg above is able to assigned any type.
const Bridge = createBridge<
    {
        msg: () => string
    }
    >()()


function A (props) {
    // then the register pattern will be this:
    useRegister('msg', () => {
        return () => props.message
    }, [props.message])
    
    return //some jsx
}


```