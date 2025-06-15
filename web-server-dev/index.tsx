import { createRoot } from 'react-dom/client';
import Example1 from './examples/example1';
import ExampleMultiple from "./examples/example-multiple";
import {memo, StrictMode, useMemo, useState, useTransition} from "react";
import ExampleTree from "./examples/example-tree";
import {Outlet, Route, Routes,} from "react-router";
import {HashRouter, NavLink} from "react-router-dom";
import ExampleNested from "./examples/example-nested";
import ExampleAsync from "./examples/example-async";

const root = createRoot(document.getElementById('app')!);


root.render(
    <>
        <StrictMode>
                <HashRouter>
                    <Routes>
                        <Route element={<Root/>}>
                            <Route path={'/'} element={<Example1/>}></Route>
                            <Route path={'/exampleMultiple'} element={<ExampleMultiple/>}></Route>
                            <Route path={'/exampleTree'} element={<ExampleTree/>}></Route>
                            <Route path={'/exampleNested'} element={<ExampleNested/>}></Route>
                            <Route path={'/exampleAsync'} element={<ExampleAsync/>}></Route>
                        </Route>


                    </Routes>
                </HashRouter>
        </StrictMode>
    </>
);


function Root() {

    return <div style={{
        height: '100vh',
        width: '100vw',
        flexFlow: 'column',
        gap: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{
            display: 'flex',
            width: '100%',
            padding: 20,
            justifyContent: 'center'
        }}>
            <NavLink to={'/'}>Essential</NavLink>
            &nbsp;
            <NavLink to={'/exampleMultiple'}>Multiple</NavLink>
            &nbsp;
            <NavLink to={'/exampleTree'}>Tree</NavLink>
            &nbsp;
            <NavLink to={'/exampleNested'}>Nested</NavLink>
            &nbsp;
            <NavLink to={'/exampleAsync'}>Async</NavLink>
        </div>

        <div style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Outlet/>
        </div>
    </div>;
}


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

