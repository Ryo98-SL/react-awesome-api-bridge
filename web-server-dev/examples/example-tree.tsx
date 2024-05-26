import {
    PropsWithChildren,
    ReactNode,
    Ref,
    RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "react";
import createBridge from "../../dist/bridge";




export default function ExampleTree() {
    const rootNodeAPI = TreeBridge.useAPI('node');

    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <TreeNode name={'Root'}>
            <TreeNode name={'Sub1'}>
                <TreeNode name={'s1-1'}>
                    <TreeNode name={'s1-1-1'}></TreeNode>
                    <TreeNode name={'s1-1-2'}/>
                    <CollapseRootNode/>
                </TreeNode>

                <TreeNode name={'s1-2'}>
                    <TreeNode name={'s1-2-1'}></TreeNode>
                    <TreeNode name={'s1-2-2'}/>
                    <ToggleSub2Node/>
                    <TreeNode name={'s1-3-2'}/>
                </TreeNode>
            </TreeNode>
            <TreeNode name={'Sub2'}>
                <TreeNode name={'s2-1'}/>
                <TreeNode name={'s2-2'}/>
                <TreeNode name={'s2-3'}/>
            </TreeNode>
        </TreeNode>

        <button onClick={() => {
            console.log(rootNodeAPI[0]?.current?.getStatus());
        }}>show root status</button>
    </div>
}


type UpdateHeight = (action: (number | "full" | ((lastHeight: number) => number))) => void;

function  TreeNode(props: PropsWithChildren<{name: ReactNode}>){
    const [collapsed, setCollapsed] = useState(false);
    const [checkState, setCheckState] = useState<boolean | 'indeterminate'>(false);
    const contentNodeRef = useRef<HTMLDivElement>(null);
    const checkboxRef = useRef<HTMLInputElement>(null);

    const parentNodeAPI = TreeBridge.useAPI('parent');


    useLayoutEffect(() => {
        const height = collapsed ? 0 : 'full';
        updateHeight(height)
    }, [props.children, collapsed]);

    const lastTargetHeight = useRef(0);

    const updateHeight = useCallback<UpdateHeight>((action) => {
        const contentNode = contentNodeRef.current;
        if(!contentNode) return;

        let finalHeight: number;
        const sh = contentNode.scrollHeight;
        const lh = lastTargetHeight.current;

        if(typeof action === 'function') {
            finalHeight = action(lh);
        } else {
            finalHeight = action === 'full' ? sh : action;
        }

        const change = finalHeight - lh;
        lastTargetHeight.current = finalHeight;

        contentNode.style.setProperty('height', `${finalHeight}px`);
        parentNodeAPI.current?.updateHeight((_lh) => _lh + change);
    }, []);

    const contextValue = TreeBridge.useContextValue();
    const leavesRef = useRef<RefObject<Tree>[]>([]);

    const leafAPIList = TreeBridge.useAPI('node', {
        onInit: (api, total) => {
            leavesRef.current = total
        },
        contextValue
    });




    const api: Tree = {
        name: props.name,
        toggleCollapse: (state) => setCollapsed( typeof state === 'undefined' ? !collapsed : state),
        toggleChecked: (state) => {
            setCheckState(typeof state === 'undefined' ? !checkState : state)
        },
        getLeaves: () => leavesRef.current,
        getStatus: () => ({checkState: checkState, collapsed}),
        updateCheckStatus: () => {
            const childNodes = leavesRef.current;
            let hasIndeterminate = false;

            let checkedSum = 0;
            for (const leaf of childNodes) {
                const status = leaf.current?.getStatus();
                if(!status) continue;
                if(status.checkState === 'indeterminate') {
                    // if child is indeterminate, the parent must also indeterminate,
                    // no need to end up full iteration.
                    hasIndeterminate = true;
                    break;
                }
                checkedSum += status.checkState === true ? 1 : 0;
            }

            setCheckState(
                hasIndeterminate ?
                    'indeterminate' :
                    checkedSum === 0 ?
                        false :
                        checkedSum === childNodes.length ?
                            true :
                            "indeterminate"
            );
        },
        updateHeight
    };

    const deps = [collapsed, checkState, updateHeight, props.name];

    TreeBridge.useRegister('parent', () => api, deps, {contextValue});
    TreeBridge.useRegister('node', () => api, deps);

    useEffect(() => {
        const checkboxNode = checkboxRef.current;
        const isIndeterminate = checkState === 'indeterminate';
        checkboxNode!.indeterminate = isIndeterminate;

        if(!isIndeterminate) {
            leafAPIList.forEach((leaf) => {
                leaf.current?.toggleChecked(checkState);
            });
        }

        parentNodeAPI?.current?.updateCheckStatus();
    }, [checkState]);


    return <TreeBridge.Boundary payload={props.name} contextValue={contextValue}>
        <div style={{display: 'flow-root'}}>
            <div style={{border: '1px solid #eee', outline: 'none', lineHeight: 2, display: 'block'}}>
                <label>
                    <input ref={checkboxRef} type={'checkbox'} checked={typeof checkState === 'boolean' ? checkState : false}
                           onChange={(e) => {
                               setCheckState(e.target.checked);
                           }}/>
                    <span>{props.name}</span>
                </label>
                {props.children && <button onClick={setCollapsed.bind(null, (ps) => !ps)}>
                    {collapsed ? "expand" : "collapse"}
                </button>}
            </div>
            <div ref={contentNodeRef} style={{marginLeft: 10, overflow: 'hidden', transition: '.3s height'}}>
                {
                    props.children
                }
            </div>
        </div>
    </TreeBridge.Boundary>;
}

function CollapseRootNode() {
    const rootAPI = TreeBridge.useUpperAPI('parent', {
        shouldForwardYield: (contextValue) => {
            return contextValue && contextValue.payload === 'Root';
        }
    });

    function collapseRoot() {
        rootAPI?.current?.toggleCollapse(true);
    }

    return <button onClick={collapseRoot}>collapse root</button>
}

function ToggleSub2Node() {
    const rootAPI = TreeBridge.useUpperAPI('parent', {
        shouldForwardYield: (contextValue) => {
            return contextValue && contextValue.payload === 'Root';
        }
    });

    function toggle() {
        rootAPI?.current?.getLeaves().find(leave => leave.current?.name === 'Sub2')?.current?.toggleCollapse()
    }

    return <button onClick={toggle}>toggle Sub2</button>
}


const TreeBridge = createBridge<
    { parent: Tree, node: Tree },
    ReactNode
>()({node: {isMulti: true}});
console.log("=>(example-tree.tsx:214) TreeBridge", TreeBridge);

type CheckedState = boolean | 'indeterminate';

interface Tree {
        name?: any;
        toggleCollapse: (state?: boolean) => void;
        toggleChecked: (state?: CheckedState) => void;
        getStatus: () => {checkState: CheckedState, collapsed: boolean};
        getLeaves: () => RefObject<Tree>[];
        updateCheckStatus():void;
        updateHeight: UpdateHeight;
}
