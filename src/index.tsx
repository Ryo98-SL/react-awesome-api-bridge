import { createRoot } from 'react-dom/client';
import Example1 from './examples/example1';
import ExampleMultiple from "./examples/example-multiple";

const root = createRoot(document.getElementById('app')!);
root.render(<div style={{height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    {/*<Example1/>*/}
    <ExampleMultiple/>
</div>);

