import createBridge from "../../../dist/bridge";


export default function ExampleNested() {

    Bridge1.useRegister('show', () => {
        return () => {
            console.log('root show')
        }
    });

    return <>
        <CComponent exepected={"nothing will show"}></CComponent>
        <AComponent></AComponent>
        <Bridge1.Boundary payload={'B upper payload'}>
            <BComponent></BComponent>
        </Bridge1.Boundary>
        <Bridge1.Boundary payload={"C upper payload"}>
            <CComponent exepected={"will show root"}></CComponent>
        </Bridge1.Boundary>

    </>;
}



function AComponent() {

    return <>
    <h1>AComponent</h1>
    </>
}


function BComponent() {

    const contextValue = Bridge1.useContextValue("B boundary payload");

    Bridge1.useRegister('show', () => {
        return () => {
            console.log('show BComponent');
        }
    }, [], {contextValue});

    return <Bridge1.Boundary contextValue={contextValue}>
        <h2>BComponent</h2>
        <CComponent exepected={"will show root"}></CComponent>
    </Bridge1.Boundary>
}

function CComponent(props: {exepected: string}) {
    const showAPI = Bridge1.useUpperAPI('show', {
        onInit: (api) => {
            console.log("=>(example-nested.tsx:48) C",api );
        },
        shouldForwardYield(boundary) {
           return !!boundary.allAPI.show
        }
    });

    const upperPayload = Bridge1.useUpperBoundaryPayload();
    const payload = Bridge1.useBoundaryPayload();

    return <h2>
        <span> {props.exepected} </span>
        <button onClick={() => showAPI?.current?.()}>show</button>
        <button onClick={() => {
            console.log("=>(example-nested.tsx:68) upper", upperPayload);
            console.log("=>(example-nested.tsx:69) ", payload);
        }}> show payloads </button>
    </h2>
}

const Bridge1 = createBridge<
    {
        show:() => void;
    },
    string
>('root payload');
