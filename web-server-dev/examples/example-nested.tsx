import createBridge from "../../dist/bridge";
import {useState} from "react";
import {BoundaryContextValue} from "../../src/types";


export default function ExampleNested() {
    const [mountB, setMountB] = useState(true);
    const [mountD, setMountD] = useState(false);
    const [showCount, setShowCount] = useState(0)

    ShowOffBridge.useRegister('show', () => {
        return () => {
            console.log('root show');
            setShowCount(showCount + 1);
            return 'root-show'
        }
    }, [showCount]);

    const showContextValue = ShowOffBridge.useContextValue("otto");
    const shoutContextValue = ShoutAtBridge.useContextValue();

    return <>
        <div>
            <button data-testid={`toggle-b`} onClick={() => setMountB(p => !p)} >toggle B</button>
            <button data-testid={`toggle-d`} onClick={() => setMountD(p => !p)} >toggle D</button>
            <span data-testid={`root-show-count`}>{showCount}</span>
        </div>
        <CComponent id={'rc'}  expected={"nothing will show"}></CComponent>

        <AComponent></AComponent>
        {
            mountB &&
            <ShowOffBridge.Boundary payload={'B upper payload'}>
                <BComponent contextValue={shoutContextValue}></BComponent>
            </ShowOffBridge.Boundary>
        }

        <ShoutAtBridge.Boundary contextValue={shoutContextValue}>
            <ShowOffBridge.Boundary payload={"C upper payload"}>
                <CComponent id={`nc`} expected={"will show root"}></CComponent>
            </ShowOffBridge.Boundary>

            {
                mountD &&
                <ShowOffBridge.Boundary contextValue={showContextValue}>
                    <ShowOffBridge.Boundary contextValue={showContextValue}>
                        <DComponent expected={``}/>
                    </ShowOffBridge.Boundary>
                </ShowOffBridge.Boundary>
            }

            <ShowOffBridge.Boundary contextValue={showContextValue}>
                <EComponent expected={``}/>
            </ShowOffBridge.Boundary>
        </ShoutAtBridge.Boundary>


    </>;
}


function AComponent() {
    const [shoutAvailableCount, setShoutAvailableCount] = useState(0)

    const shoutAPIList = ShoutAtBridge.useAPI('shout', {
        onInit(api, total) {
            if(!api) {
                setShoutAvailableCount((p) => p + total.length);
                return () => {
                    setShoutAvailableCount((p) => p - total.length);
                }
            } else {
                setShoutAvailableCount((p) => p + 1);
                return () => {
                    setShoutAvailableCount((p) => p - 1);
                }
            }
        }
    })
    return <div>
        <h1>AComponent</h1>shout available count:<span data-testid={`a-stat-count`}>{shoutAvailableCount}</span>
    </div>
}


function BComponent(props: {contextValue: BoundaryContextValue<ShoutAtAPI, string, {shout: {isMulti: true} }>}) {
    const [shoutCount, setShoutCount] = useState(0);
    const [showCount, setShowCount] = useState(0);
    const contextValue = ShowOffBridge.useContextValue("B boundary payload");
    console.log("=>(example-nested.tsx:91) shoutCount", shoutCount);
    ShoutAtBridge.useRegister('shout', () => {
        return () => {
            console.log("=>(example-nested.tsx:94) B shout", );
            setShoutCount(shoutCount + 1);
            console.log("=>(example-nested.tsx:95)", shoutCount + 1);
            return 'B: Just do it!'
        }
    }, [shoutCount], {contextValue: props.contextValue});

    ShowOffBridge.useRegister('show', () => {
        return () => {
            setShowCount(showCount + 1);
            return `b-show`
        }
    }, [showCount], {contextValue});

    return <ShowOffBridge.Boundary contextValue={contextValue}>
        <div data-testid={`b-comp`} style={{border: '1px solid', paddingInline: 8}}>
            <h2>BComponent</h2>
            <CComponent id={`bc`} expected={"will show root"}></CComponent>

            B shoutCount:<span data-testid={'b-shout-count'} data-count={shoutCount}>{shoutCount}</span>,
            B showCount:<span data-testid={'b-show-count'}>{showCount}</span>
        </div>


    </ShowOffBridge.Boundary>
}

function CComponent(props: { expected: string, id: string }) {
    const [showContent, setShowContent] = useState('')
    const showAPI = ShowOffBridge.useUpperAPI('show', {
        onInit: (api) => {
            console.log("=>(example-nested.tsx:48) C", api);
        },
        shouldForwardYield(boundary) {
            return !!boundary.allAPI.show
        }
    });

    const upperPayload = ShowOffBridge.useUpperBoundaryPayload();
    const payload = ShowOffBridge.useBoundaryPayload();
    const [logContent, setLogContent] = useState('')

    return <div>
        <h2>
            <span>C: {props.expected} </span>
            <button data-testid={`c-${props.id}-show`} onClick={() => {
                const showContent = showAPI?.current?.();
                setShowContent(showContent || '');
            }}>show</button>
            <button data-testid={`c-${props.id}-show-payloads`} onClick={() => {
                setLogContent(`upper(${upperPayload})(${payload})`)
            }}> show payloads
            </button>
        </h2>
        <span data-testid={`c-${props.id}-payload`}>
            {logContent}
        </span>,
        <span data-testid={`c-${props.id}-show-content`}>{showContent}</span>
    </div>
}

function DComponent(props: { expected: string }) {
    const [shoutCount, setShoutCount] = useState(0);
    const [showCount, setShowCount] = useState(0)
    ShoutAtBridge.useRegister('shout', () => {
        return () => {
            setShoutCount(p => p + 1)
            return 'D: Let me first!'
        }
    });

    ShowOffBridge.useRegister('show',() => () => {
        setShowCount(p => p + 1);
        return 'hello, I\'m D'
    });

    return <p>
        DComponent: <span data-testid={`d-show-count`}>{showCount}</span>,<span data-testid={`d-shout-count`}>{shoutCount}</span>
    </p>
}

function EComponent(props: { expected: string }) {
    const [logContent, setLogContent] = useState('');
    const [shoutAvailableCount, setShoutAvailableCount] = useState(0);
    const [shoutCount, setShoutCount] = useState(0)
    const showAPI = ShowOffBridge.useAPI('show', {
        onInit(api) {
            setLogContent('showing')
            return () => {
                setLogContent('unmount')
            }
        }
    });

    ShoutAtBridge.useRegister('shout', () => {
        return () => {
            setShoutCount(shoutCount + 1);
            return 'E: Shut up!'
        }
    }, [shoutCount]);

    const shoutAtApi = ShoutAtBridge.useAPI('shout', {
        onInit(api, total) {
            if(!api) {
                setShoutAvailableCount((p) => p + total.length);
                return () => {
                    setShoutAvailableCount((p) => p - total.length);
                }
            } else {
                setShoutAvailableCount((p) => p + 1);
                return () => {
                    setShoutAvailableCount((p) => p - 1);
                }
            }
        }
    });

    return <div>
        <button data-testid={`e-show-btn`}
                onClick={() => showAPI.current?.()}
        >
            show
        </button>

        <button data-testid={`e-make-shout`}
                onClick={() => {
                    shoutAtApi.forEach(api => api.current?.())
                }}
        >let all shout</button>

        <span data-testid={`e-log-area`}>
            {logContent}
        </span>
        ,
        <span data-testid={`e-stat-count`}>
            {shoutCount},{shoutAvailableCount}
        </span>
    </div>
}

const ShowOffBridge = createBridge<
    {
        show: () => string;
    },
    string
>('root payload');

type ShoutAtAPI = {
    shout: () => string;
};
const ShoutAtBridge = createBridge<
    ShoutAtAPI
>()({shout: {isMulti: true}});
