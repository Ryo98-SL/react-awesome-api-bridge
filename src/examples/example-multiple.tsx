import createBridge from "../bridge";
import {useEffect, useState} from "react";


export default function ExampleMultiple() {

    const {getAPI} = EMBridge.useTools();
    EMBridge.useAPI('B', { onInit: (api, initialized) => {
            console.log("=>(example-multiple.tsx:19) api", api);

        console.log("=>(example-multiple.tsx:11) initialized", initialized.length, initialized);
        // const B1Api = initialized.find((api) => {
        //     console.log("=>(example-multiple.tsx:12) api", api);
        //     return api.id === '01'
        // });
        // if(B1Api) {
        //     console.log("B1Api has been init");
        // }
    }})


    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <button onClick={() => {
            getAPI('B').find(({id}) => id === '01')?.introduce?.();
        }}>
            let first B introduce itself.
        </button>
        <AComponent/>
        <BComponent id={'01'}/>
        <BComponent id={'02'}/>
    </div>
}

function AComponent(){
    const {getAPI} = EMBridge.useTools();
    EMBridge.useRegister('A', {
        sing(){
            console.log("A: sing",);
        }
    });
    return <div>
        AComponent <button onClick={() => {
        const secondB = getAPI('B').find((api) => {
            const {id} = api
            return id === '02'
        });
        secondB?.introduce?.();
    }}>let second B introduce itself.</button>
    </div>
}

function BComponent(props: {id: string}){
    const {id} = props;
    const [otherDesc, setOtherDesc] = useState('thank you');

    EMBridge.useRegister('B', {
        id,
        introduce(){
            console.log(`${id}_B: My id is ${id}, ${otherDesc}.`,);
        }
    },[id, otherDesc])

    return <div>
        {id} BComponent
        <input value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)}/>
    </div>
}

const EMBridge = createBridge<
    {
        A: {
            sing():void;
        },
        B: {
            id: string;
            introduce(): void;
        }
    }
>()({
    B: {
        isMulti: true
    }
})