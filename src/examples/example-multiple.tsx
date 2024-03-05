import createBridge from "../bridge";
import {useEffect, useId, useState} from "react";


export default function ExampleMultiple() {
    const id = useId();
    const {getAPI} = EMBridge.useTools();
    const [BIds, setBIds] = useState(['01', '02']);
    const [newId, setNewId] = useState('');

    EMBridge.useRegister('B', () => ({
        id: '03',
        introduce: () =>  console.log('03 B')
    }), []);
    EMBridge.useAPI('B', { onInit: (api, initialized) => {
        console.log("(root) api", api, initialized.length, initialized);

    }})

    const [showA, setShowA] = useState(true);

    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <button onClick={() => {
            getAPI('B').find(({id}) => id === '01')?.introduce?.();
        }}>
            let B with id of 01 introduce itself.
        </button>

        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                if(BIds.includes(newId)) return;
                setBIds([...BIds, newId]);
            }}>
                <label>
                    new id:
                    <input value={newId} onChange={(e) => setNewId(e.target.value)}/>
                </label>
                <button>
                    add
                </button>
            </form>
        </div>

        <button onClick={() => setShowA(!showA)}>toggle A</button>
        {showA && <AComponent/>}


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
    const [prefix, setPrefix] = useState('foo');

    EMBridge.useAPI('B', {
        onInit: (api, total) => {

            // This callback will be invoked when it first mounted and lookup all previously mounted useRegister
            // which have "B" of value of the first parameter, then it invoked as this form "onInit(undefined, total)",
            // when follow-up useRegister which have "B" of value of the first parameter mounted, it will be invoked
            // as this form "onInit(api, total)".
            //
            // When this callback is invoked, the subsequent state change won't make it call again.
            console.log(`(A)_${prefix}`, api, total);
        }
    });

    EMBridge.useRegister('A', () => ({
        sing(){
            console.log("A: sing");
        }
    }));

    return <div style={{outline: '1px solid', padding: 10}}>
        AComponent
        <div>
            <button onClick={() => {
                const secondB = getAPI('B').find((api) => {
                    const {id} = api
                    return id === '02'
                });
                secondB?.introduce?.();
            }}> let B with id of 02 introduce itself.</button>
        </div>

        <div>
            <form onSubmit={(e) => {
                // console.log("=>(example-multiple.tsx:93) ", prefix);
                e.preventDefault()
            }}>
                <input value={prefix} onChange={e => setPrefix(e.target.value)}/>
                {/*<button>change</button>*/}
            </form>
        </div>
    </div>
}

interface BComponentProps {
    onDelete: () => void;
    id: string
}

function BComponent(props: BComponentProps){
    const {id} = props;
    const [otherDesc, setOtherDesc] = useState('thank you');

    EMBridge.useRegister('B', () => ({
        id,
        introduce(){
            console.log(`${id}_B: My id is ${id}, ${otherDesc}.`,);
        }
    }),[id, otherDesc])

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

console.log(EMBridge)