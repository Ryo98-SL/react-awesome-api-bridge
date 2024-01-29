import createBridge from "../bridge";
import {useEffect, useId, useState} from "react";


export default function ExampleMultiple() {
    const id = useId();
    const {getAPI} = EMBridge.useTools();
    const [BIds, setBIds] = useState(['01', '02']);
    const [newId, setNewId] = useState('');

    EMBridge.useAPI('B', { onInit: (api, initialized) => {
        console.log("=>(example-multiple.tsx:19) api", api);
        console.log("=>(example-multiple.tsx:11) initialized", initialized.length, initialized);
    }})


    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <button onClick={() => {
            getAPI('B').find(({id}) => id === '01')?.introduce?.();
        }}>
            let B with id of 01 introduce itself.
        </button>

        <div>
            <label>
                new id:
                <input value={newId}
                       onKeyUp={(e) => {
                           if(BIds.includes(newId) || e.key !== 'Enter') return;
                            setBIds([...BIds, newId])
                       }}
                       onChange={(e) => setNewId(e.target.value)}/></label>
            <button onClick={() => {
                if(BIds.includes(newId)) return;
                setBIds([...BIds, newId])
            }}

            >
                add
            </button>
        </div>
        <AComponent/>

        {
            BIds.map((id) => {
                return <BComponent key={id}
                                   onDelete={() => {
                                       setBIds(BIds.filter(_i => _i !== id))
                                   }}
                                   id={id}/>
            })
        }
    </div>
}

function AComponent(){
    const {getAPI} = EMBridge.useTools();
    const id = useId();

    EMBridge.useRegister('A', {
        sing(){
            console.log("A: sing");
        }
    });

    return <div>
        AComponent <button onClick={() => {
        const secondB = getAPI('B').find((api) => {
            const {id} = api
            return id === '02'
        });
        secondB?.introduce?.();
    }}> let B with id of 02 introduce itself.</button>
    </div>
}

interface BComponentProps {
    onDelete: () => void;
    id: string
}

function BComponent(props: BComponentProps){
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
        <button onClick={props.onDelete}>delete</button>
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