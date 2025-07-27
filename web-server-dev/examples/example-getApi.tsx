import {createBridge, getBridgeAPI, createBoundary, getBridgeAPIAsync, useAPI, useRegister, useTools, useBoundaryPayload, useBoundaryContext, useBoundaryRef, useUpperAPI, useUpperBoundaryPayload} from "../../dist/lib/index";
import {useState} from "react";




export default function ExampleGetApi() {

    const [content, setContent] = useState('')
    const [rap, setRap] = useState(false);
    useRegister(InitBridge, 'single', () => {
        return () => {
            console.log('Music!');

            return 'global'
        }
    });


    useAPI(InitBridge, 'single', {
        onInit: (api) => {
            setContent(api.current!());
        }
    });

    const cv = useBoundaryContext(InitBridge);



    useRegister(InitBridge, 'rap', () => {
        return () => setRap(!rap);
    });

    const rapAPI =useAPI(InitBridge, 'rap')



    return <div>
        <InitBoundary contextValue={cv}>
            <IkunComponent id={'inner'}/>
        </InitBoundary>

        <InitBoundary>
            <IkunComponent id={'later'}/>
        </InitBoundary>
        <div>
            <button data-testid={"kun-rap-btn-global"} onClick={() => {
                getBridgeAPI(InitBridge, 'rap').current!();
            }}>rap</button>

            <button data-testid={"kun-rap-btn-global-hook"} onClick={() => {
                rapAPI.current!();
            }}>
                rap using hook
            </button>

            <span data-testid="kun-rapping-global">{rap ? 'rapping' : ''}</span>
        </div>


        <div>
            <button data-testid={"kun-rap-btn-global-inner"} onClick={() => {
                getBridgeAPI(InitBridge, 'rap', { contextValue: cv }).current!();
            }}>rap inner</button>
        </div>


        <div data-testid={"kun-content-global"}>{content}</div>
    </div>
}



function IkunComponent(props: {id: string}) {

    const [rap, setRap] = useState(false);
    const [content, setContent] = useState('');

    useAPI(InitBridge, 'single', {
        onInit: (api) => {
            setContent(api.current!());
        }
    });

    useRegister(InitBridge, 'single', () => {
        return () => {
            console.log('Individual ikun');
            return `ikun-${props.id}`;
        }
    });

    useRegister(InitBridge, 'rap', () => {
        return () => {
            console.log(`${props.id} rapping`);
            setRap(!rap);
        }
    });

    const {getAPIAsync} = useTools(InitBridge);


    return <div data-testid={`kun-comp-${props.id}`} style={{ border: '1px solid blue' }}>
        <p data-testid={`kun-content-${props.id}`}>
            {
                content
            }
        </p>
        <p data-testid={`kun-rapping-${props.id}`}>{ rap ? 'rapping' : '' }</p>

        <button data-testid={`kun-rap-btn-${props.id}`} onClick={() => {
            getAPIAsync('rap').then((api) => {
                api.current!();
            });
        }}>rap</button>

        <button data-testid={`kun-rap-btn-${props.id}-global`} onClick={() => {
            getBridgeAPI(InitBridge, 'rap').current!();
        }}>
            rap global
        </button>
    </div>
}


const InitBridge = createBridge<
    {
        single: () => string;
        rap: () => void;
    }
>();

const InitBoundary = createBoundary(InitBridge);