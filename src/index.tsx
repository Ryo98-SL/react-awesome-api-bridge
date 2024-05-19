import { createRoot } from 'react-dom/client';
import Example1 from './examples/example1';
import ExampleMultiple from "./examples/example-multiple";
import {memo, StrictMode, useMemo, useState, useTransition} from "react";
import ExampleTree from "./examples/example-tree";

const root = createRoot(document.getElementById('app')!);
root.render(
    <>
        <StrictMode>
            <div style={{height: '100vh', width: '100vw', flexFlow: 'column', gap: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {/*<Example1/>*/}
                {/*<ExampleMultiple/>*/}
                <ExampleTree/>

            </div>

        </StrictMode>
    </>

);


function NoMemo() {
    const [value, setValue] = useState('');
    const [num, setNum] = useState(0);
    const [isPending, startTransition] = useTransition();

    return <div>
        <input value={value} onChange={({target}) => {
            setValue(target.value);
            startTransition(() => {
                setNum(p => p + 1);
            })
        }}/>

        <Child num={num}/>
    </div>
}

function HookMemo() {
    const [value, setValue] = useState('');
    const [num, setNum] = useState(0);
    const [isPending, startTransition] = useTransition();
    const child = useMemo(() => {
        return <Child num={num}/>
    }, [num]);

    return <div>
        <input value={value} onChange={({target}) => {
            setValue(target.value);
            startTransition(() => {
                setNum(p => p + 1);
            })
        }}/>
        {child}
    </div>
}

function MemoA() {
    const [value, setValue] = useState('');
    const [num, setNum] = useState(0);
    const [isPending, startTransition] = useTransition();
    return <div>
        <input value={value} onChange={({target}) => {
            setValue(target.value);
            startTransition(() => {
                setNum(p => p + 1);
            })
        }}/>

        <MemoChild num={num}/>
    </div>
}



function Child(props: {num: number}) {
    console.log("=>(index.tsx:63) render", );
    const start = Date.now();
    while(Date.now() - start < 50) {
        //
    }
    return <p>{props.num}</p>
}

const MemoChild = memo(Child)

