import { createRoot } from 'react-dom/client';
import Example1 from './examples/example1';
import ExampleMultiple from "./examples/example-multiple";
import {StrictMode} from "react";
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

