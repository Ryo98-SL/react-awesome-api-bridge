import createBridge from "../../dist/bridge";
import {useEffect, useId, useRef, useState} from "react";


export const id1 = `log-panel-outer__`;

export default function ExampleMultiple() {
    const id = useId();
    const {getAPI} = EMBridge.useTools();
    const [BIds, setBIds] = useState(['01', '02']);
    const [newId, setNewId] = useState('');
    const [thirdBIntroduced, setThirdBIntroduced] = useState(false);
    const payloadId = EMBridge.useBoundaryPayload();

    const [mountedBList, setMountedBList] = useState<
        string[]
    >([])
    /**
     * the register of 'B' is not limited within 'B' component,
     * technically it can be register anywhere in component tree.
     */
    EMBridge.useRegister('B', () => ({
        id: '03',
        introduce: () => {
            setThirdBIntroduced(true);
            console.log('03 B')
        }
    }), []);
    const BApiList = EMBridge.useAPI('B');
    EMBridge.useAPI('B', {
        onInit: (api, total) => {
            console.log("(root) api", api, total.length, total);

            if(api) {
                const id1 = api.current!.id;
                setMountedBList((prevState) => {
                    return [
                        ...prevState,
                        id1
                    ]
                })
                return () => {
                    setMountedBList((prevState) => {
                        return prevState.filter(id => id !== id1)
                    })
                }
            } else {
                const idList = total.map((api) => {
                    return api.current!.id
                });
                setMountedBList(
                    idList
                )

                return () => {
                    setMountedBList(prevState => {
                        return prevState.filter(id => !idList.includes(id))
                    })
                }
            }

        }
    });

    const [showA, setShowA] = useState(true);

    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <button data-testid={`${payloadId}01-intro-btn`} onClick={() => {
            getAPI('B').find((apiRef) => apiRef.current?.id === '01')?.current?.introduce();
        }}>
            let B with id of 01 introduce itself.
        </button>

        <button onClick={() => {
            BApiList.find(bApi => bApi.current!.id === '03')!.current!.introduce();
        }}
                data-testid={`${id1}-03-intro-btn`}
        >
            call the invisible 03 B's introduce method.
        </button>

        <p data-testid={`${payloadId}mounted-b`}>
            {
                mountedBList.join(',')
            }
        </p>

        {thirdBIntroduced && <p data-testid={"03b"}>the 03 B introduced</p>}

        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                if(BIds.includes(newId)) return;
                setBIds([...BIds, newId]);
            }}>
                <label>
                    new id:
                    <input data-testid="input-outer" value={newId} onChange={(e) => setNewId(e.target.value)}/>
                </label>
                <button data-testid="add-btn-outer">
                    add
                </button>
            </form>
        </div>

        <button data-testid="toggleA-outer" onClick={() => setShowA(!showA)}>toggle A</button>
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
    const {getAPI, getBoundaryPayload} = EMBridge.useTools();
    const [prefix, setPrefix] = useState('foo');
    const payloadId = getBoundaryPayload();
    const [mountedBList, setMountedBList] = useState<string[]>([])
    const [sangLabel, setSangLabel] = useState('');

    EMBridge.useAPI('B', {
        onInit: (api, total) => {
            if(!api) {
                // When this useAPI hook first executed, it will call this function with other already registered 'B' api,
                // batched all of it as an array for the second argument(total), and the first argument is undefined(api),
                // and the returned clear function will be called when this useAPI hook unmounted.
                const idList = total.map(api => api.current!.id);
                setMountedBList((prevState) => {
                    return idList
                })
                return () => {
                    setMountedBList( prevState  => {
                        return prevState.filter((id) => {
                            return !idList.includes(id)
                        });
                    })
                }
            } else {
                // When there is subsequent api registered for 'B', this function will be called with the first argument as
                // the subsequently registered api, and the total will be all registered api including the  subsequently registered api,
                // and the returned clear function will be called when correspond useRegister hook unmounted.
                const id = api.current!.id;
                setMountedBList((prevState) => {
                    return [
                        ...prevState,
                        id
                    ]
                })

                return () => {
                    setMountedBList((prevState) => prevState.filter(_id => _id !== id))
                }
            }
        }
    });

    EMBridge.useRegister('A', () => ({
        sing(){
            setSangLabel(`${payloadId}-${prefix}-A-sang`);
            console.log("A: sing");
        }
    }), [payloadId, prefix]);

    const ownAPI = EMBridge.useAPI('A')

    return <div style={{outline: '1px solid', padding: 10}}>
        AComponent
        <div>
            <button onClick={() => {
                ownAPI.current!.sing();
            }}
                    data-testid={`${payloadId}sing-btn`}
            >sing</button>

            <p data-testid={`${payloadId}-a-sang`}>
                {
                    sangLabel
                }
            </p>

            <button
                data-testid={`${payloadId}-a-intro02b-btn`}
                onClick={() => {
                const secondB = getAPI('B').find((api) => {
                    const {id} = api.current || {}
                    return id === '02'
                });
                secondB?.current?.introduce();
            }}> let B with id of 02 introduce itself.</button>
        </div>

        <p data-testid={`${payloadId}-ab`}>
            {
                mountedBList.join(',')
            }
        </p>

        <div>
            <form onSubmit={(e) => {
                // console.log("=>(example-multiple.tsx:93) ", prefix);
                e.preventDefault()
            }}>
                <input data-testid={`${payloadId}a-input`}  value={prefix} onChange={e => setPrefix(e.target.value)}/>
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
    const payloadId = EMBridge.useBoundaryPayload();
    const countRef = useRef(0);
    const [introducedText, setIntroducedText] = useState('');

    EMBridge.useRegister('B', () => ({
        id,
        introduce(){
            countRef.current++;
            setIntroducedText(`${otherDesc}-${countRef.current}`);
            console.log(`${id}_B: My id is ${id}, ${otherDesc}.`,);
        }
    }),[id, otherDesc])

    return <div>
        {id} BComponent
        <input value={otherDesc} data-testid={`${payloadId}input-${id}`}  onChange={(e) => setOtherDesc(e.target.value)}/>
        <button data-testid={`${payloadId}b-delete-${id}`} onClick={props.onDelete}>delete</button>
        <p data-testid={`${payloadId}b-count-${id}`}>
            {introducedText}
        </p>

        <p data-testid={`${payloadId}b-desc-${id}`}>
            {
                otherDesc
            }
        </p>


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
    },
    string
>(id1)({
    B: {
        isMulti: true
    }
});

console.log(EMBridge);




