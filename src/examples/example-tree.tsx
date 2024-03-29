import {PropsWithChildren, ReactNode, Ref, RefObject, useEffect, useLayoutEffect, useRef, useState} from "react";
import createBridge from "../bridge";


export default function ExampleTree() {
    return <div style={{width: 500, background: 'white', height: 'fit-content', padding: '20px', outline: '1px solid'}}>
        <TreeNode name={'Root'}>
            <TreeNode name={'Sub1'}>
                <TreeNode name={'s1-1'}>
                    <TreeNode name={'s1-1-1'}></TreeNode>
                    <TreeNode name={'s1-1-2'}/>
                    <CollapseRootNode/>
                </TreeNode>
            </TreeNode>
            <TreeNode name={'Sub2'}>
                <TreeNode name={'s2-1'}/>
                <TreeNode name={'s2-2'}/>
                <TreeNode name={'s2-3'}/>
            </TreeNode>
        </TreeNode>
    </div>
}




function TreeNode(props: PropsWithChildren<{name: ReactNode}>){
    const [collapsed, setCollapsed] = useState(false);
    const [checked, setChecked] = useState(false);
    const [indeterminate, setIndeterminate] = useState(false);
    const contentNodeRef = useRef<HTMLDivElement>(null);
    const checkboxRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        const contentNode = contentNodeRef.current;
        if(!contentNode) return;
        const height = collapsed ? 0 : (contentNode.scrollHeight || 0);
        contentNode.style.setProperty('height', height + 'px');
    }, [props.children, collapsed]);

    const contextValue = TreeBridge.useChildContextValue();
    const leavesRef = useRef<RefObject<Tree>[]>([]);

    const leafAPIList = TreeBridge.useAPI('node', {
        onInit: (api, total) => {
            leavesRef.current = total
        },
        contextValue
    });

    const parentNodeAPI = TreeBridge.useAPI('parent');

    const api: Tree = {
        name: props.name,
        toggleCollapse: (state) => setCollapsed( typeof state === 'undefined' ? !collapsed : state),
        toggleChecked: (state) => setChecked( typeof state === 'undefined' ? !checked : state),
        getLeaves: () => leavesRef.current,
        getStatus: () => ({checked, collapsed, indeterminate}),
        updateCheckStatus: () => {
            const checkboxNode = checkboxRef.current;
            const childNodes = leavesRef.current;
            let hasIndeterminate = false;
            const checkedSum = childNodes.reduce((sum, leaf) => {
                const status = leaf.current?.getStatus();
                if(!status) return sum;
                if(status.indeterminate) hasIndeterminate = true;
                return sum + (status.checked ? 1 : 0)
            }, 0);


            const allChecked = childNodes.length === checkedSum;
            setIndeterminate((!allChecked && checkedSum > 0) || hasIndeterminate);
            setChecked(allChecked);
        }
    };

    TreeBridge.useRegister('parent', () => api, [collapsed, checked, indeterminate, props.name], {contextValue});
    TreeBridge.useRegister('node', () => api, [collapsed, checked, indeterminate, props.name]);

    useEffect(() => {
        const checkboxNode = checkboxRef.current;
        checkboxNode!.indeterminate = indeterminate;

        if(!indeterminate) {
            leafAPIList.forEach((leaf) => {
                leaf.current?.toggleChecked(checked);
            });
        }

        parentNodeAPI?.current?.updateCheckStatus();
    }, [checked, indeterminate]);


    return <TreeBridge.Boundary payload={props.name} contextValue={contextValue}>
        <div style={{display: 'flow-root'}}>
            <div style={{border: '1px solid #eee', outline: 'none', lineHeight: 2, display: 'block'}}>
                <label>
                    <input ref={checkboxRef} type={'checkbox'} checked={checked} onChange={(e) => {
                        setChecked(e.target.checked);
                        setIndeterminate(false);
                    }}/>
                    <span>{props.name}</span>
                </label>
                {props.children && <button onClick={setCollapsed.bind(null, (ps) => !ps)}>
                    {collapsed ? "expand" : "collapse"}
                </button>}
            </div>

            <div ref={contentNodeRef} style={{marginLeft: 10, overflow: 'hidden',transition: '.3s height'}}>
                {
                    props.children
                }
            </div>
        </div>
    </TreeBridge.Boundary>
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


const TreeBridge = createBridge<
    { parent: Tree, node: Tree }
>()({node: {isMulti: true}});

interface Tree {
        name?: any;
        toggleCollapse: (state?: boolean) => void;
        toggleChecked: (state?: boolean) => void;
        getStatus: () => {checked: boolean, collapsed: boolean, indeterminate: boolean};
        getLeaves: () => RefObject<Tree>[];
        updateCheckStatus():void;
}