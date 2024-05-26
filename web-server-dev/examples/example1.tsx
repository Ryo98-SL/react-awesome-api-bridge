import createBridge from "../../dist/bridge";

import {PropsWithChildren, useCallback, useEffect, useRef, useState} from "react";

export default function Example1() {
    const CApi = ExaBridge.useAPI('C');
    const BApi = ExaBridge.useAPI('B', {
        onInit: (api) => {
            console.log("=>(example1.tsx:9) invokeA by BApi", api.current?.invokeA('Root'));
        }
    });

    const [showB, setShowB] = useState(false);

    return <>
        <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
            hello world!
            <div style={{padding: 10}}>
                <button onClick={() => {
                    CApi.current?.move(5);
                }}>
                    Move C 5 unit
                </button>

                <button onClick={() => {
                    CApi.current?.setUnit('px');
                }}>Set to px unit of C
                </button>

                {/*Bad, because you will pass an undefined value*/}
                {/*<button onClick={BApi.current?.callA}>call A by proxying B</button>*/}

                {/*Good,it will dynamic access "callA"  method and invoke once the arrow function of onClick is called*/}
                <button onClick={() => BApi.current?.invokeA('indirect')}>Indirectly invoke "bark" of A by invoking "invokeA" of B</button>

                <button onClick={() => {
                }}
                        style={{background: 'orangered'}}

                >
                    Try to reassign BApi.callA(Oh dear, don't do it)
                </button>

            </div>

            <AComponent></AComponent>

            <button onClick={() => setShowB(!showB)}>toggle B</button>
            {
                showB &&
                <BComponent></BComponent>
            }

            {/*CComponent is inside the DeepC, but it's api still available!*/}
            <DeepC stacks={3}/>
        </div>

        <div>
            <button onClick={() => {
                const AApi = ExaBridge.getAPI('A');
                AApi.current?.bark('outer')
            }}>
                callA without hook
            </button>
        </div>
    </>
}


function AComponent() {
    const timerRef = useRef<any>();
    const [content, setContent] = useState('');
    ExaBridge.useRegister('A', () => ({
        bark(form: string) {
            let voice = `from:${form}`;
            setContent(voice);
            console.log(`A: ${voice}`,);
        }
    }), []);


    return <div role={'alert'} style={{background: 'salmon'}}>
        AComponent
        {
            content && `: ${content}`
        }
    </div>
}

function BComponent() {
    const AApi = ExaBridge.useAPI('A');
    const invokeA = useCallback((form: string) => {
        console.log("B: Hi, A, can you bark?" );
        AApi.current?.bark(form);

    }, []);

    ExaBridge.useRegister('B', () => ({
        invokeA,
    }), []);
    const {getAPI} = ExaBridge.useTools();

    return <div style={{background: 'lightcyan'}}>
        BComponent
        <button onClick={invokeA.bind(null, 'B')}>invoke A's bark</button>
        <button onClick={() => {
            console.log("B: Hi, C, can you move 10 units?" );
            getAPI('C').current?.move(10);
        }}>invoke C's move</button>
    </div>
}

function CComponent() {
    const [unit, setUnit] = useState<'px' | 'rem'>('px');
    const [position, setPosition] = useState(0);

    ExaBridge.useRegister('C', () => ({
        move(delta){
            console.log(`C: Okay, move ${delta}${unit}`);
            setPosition(position + delta);
        },
        setUnit
    }), [position, unit]);

    useEffect(() => {
        console.log(`C: current unit is ${unit}`);
    }, [unit])

    return <div style={{background: 'lightblue', transform: `translateX(${position}${unit})`}}>
        CComponent
        <button onClick={() => {
            setUnit(unit === 'px' ? 'rem' : 'px')
        }}>change Unit</button>
    </div>
}

function DeepC(props: {layerIndex?: number, stacks: number}) {
    let layerIndex = props.layerIndex ?? 0;

    if(layerIndex < props.stacks) {
        return <div style={{padding: '10px', outline: '1px solid black', background: '#aaa'}}>
            <DeepC layerIndex={layerIndex + 1} stacks={props.stacks}></DeepC>
        </div>

    } else {
        return <CComponent/>
    }
}

const ExaBridge = createBridge<
    {
        A: {
            bark(form: string):void;
        },
        B: {
            invokeA(form: string):void;
        }
        C: {
            move(delta: number): void;
            setUnit(unit: 'px' | 'rem'): void;
        }
    }
>();
