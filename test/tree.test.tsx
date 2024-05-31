import React, {StrictMode} from 'react'

import {render, fireEvent, screen, getByTestId} from '@testing-library/react'
import '@testing-library/jest-dom'

import ExampleTree from "../web-server-dev/examples/example-tree";

test(`test example tree`, async () => {
    render(<ExampleTree/>);

    clickCheckbox(RootNode);
    expectTreeDescentsAllWith(RootNode, true);

    clickCheckbox(Sub1);
    expectOwnCheckboxStatus(RootNode, 'indeterminate');
    expectTreeAllWith(Sub1, false);

    clickCheckbox(RootNode)
    expectTreeDescentsAllWith(RootNode, true);

    clickCheckbox(Sub2)
    expectOwnCheckboxStatus(RootNode, 'indeterminate');
    expectTreeAllWith(Sub2, false);

    clickCheckbox('s2-1');
    expectOwnCheckboxStatus(Sub2, 'indeterminate');
    clickCheckbox(Sub2);
    expectTreeAllWith(Sub2, true);
    clickCheckbox('s2-2');
    expectOwnCheckboxStatus('s2-1', true);
    expectOwnCheckboxStatus('s2-3', true);
    expectOwnCheckboxStatus(RootNode, 'indeterminate');

    clickEffectBtn(`collapse-root`);
    expectRootNodeStatus('indeterminate', true);

    clickCheckbox(Sub2)
    expectRootNodeStatus(true, true);

    clickToggleTreeBtn(RootNode);
    expectRootNodeStatus(true, false);

    clickCheckbox(RootNode);
    expectTreeAllWith(RootNode, false);

    clickCheckbox(`s1-3-2`);
    expectOwnCheckboxStatus(S12, 'indeterminate');
    expectOwnCheckboxStatus(Sub1, 'indeterminate');
    expectOwnCheckboxStatus(RootNode, 'indeterminate');
    expectOwnCheckboxStatus(Sub2, false);
    clickCheckbox(Sub2);
    expectOwnCheckboxStatus(S12, 'indeterminate');
    clickCheckbox(S12);
    expectTreeAllWith(S12, true);
    expectOwnCheckboxStatus(Sub1, 'indeterminate');
    expectOwnCheckboxStatus(RootNode, 'indeterminate');
    clickCheckbox(RootNode);

    expectTreeAllWith(RootNode, true);

});


const S11: TreeNode = makeTreeNode(
    "s1-1",
    [
        makeTreeNode("s1-1-1"),
        makeTreeNode("s1-1-2"),
        makeTreeNode("collapse-root", [], "effect"),
    ]
);

const S12: TreeNode = makeTreeNode(
    "s1-2",
    [
        makeTreeNode("s1-2-1"),
        makeTreeNode("s1-2-2"),
        makeTreeNode("toggle-Sub2", [], "effect"),
        makeTreeNode("s1-3-2"),
    ]
);


const Sub2: TreeNode = makeTreeNode(
    "Sub2",
    [
        makeTreeNode("s2-1"),
        makeTreeNode("s2-2"),
        makeTreeNode("s2-3"),
    ]
)

const Sub1 = makeTreeNode(
    "Sub1",
    [
        S11,
        S12
    ]
);
const RootNode = makeTreeNode(
    "Root",
    [
        Sub1,
        Sub2
    ]
);
const structure: TreeNode[] = [
    RootNode,
    makeTreeNode(
        "show-root-status",
        [],
        "effect"
    )
]

type TreeNode = {
    type: 'control' | 'effect';
    children?: TreeNode[];
    name: string;
}

function makeTreeNode(name: string, children: TreeNode[] = [], type: TreeNode['type'] = "control") {
    return {
        type,
        name,
        children,
    }
}

function expectDirectChildAllWith(node: TreeNode, checked: boolean) {
    node.children?.forEach((child) => {
        if (child.type !== 'control') return;
        const checkbox = getCheckboxByName(child.name);
        expect(checkbox.checked).toBe(checked);
    });
}

function expectTreeAllWith(node: TreeNode, checked: boolean) {
    expectOwnCheckboxStatus(node, checked);
    expectTreeDescentsAllWith(node, checked);
}

function expectTreeDescentsAllWith(node: TreeNode, checked: boolean) {
    expectDirectChildAllWith(node, checked);
    node.children?.forEach((node) => expectTreeDescentsAllWith(node, checked));
}

function getCheckboxByName(name: string) {
    return screen.getByTestId(`cb-${name}`) as HTMLInputElement;
}

function getToggleBtnByName(name: string) {
    return screen.getByTestId(`toggle-${name}`) as HTMLButtonElement;
}

function getEffectButtonByName(name: string) {
    return screen.getByTestId(`effect-${name}`) as HTMLButtonElement;
}

function expectOwnCheckboxStatus(entry: Entry, status: boolean | 'indeterminate') {
    let checkbox = getCheckbox(entry)

    if (status === "indeterminate") {
        expect(checkbox.indeterminate).toBeTruthy();
    } else {
        expect(checkbox.checked).toBe(status);
    }
}

type Entry = string | TreeNode | HTMLElement;

function getCheckbox(entry: Entry) {
    let checkbox: HTMLInputElement;
    if (typeof entry === 'string') {
        checkbox = getCheckboxByName(entry);
    } else if (entry instanceof HTMLInputElement) {
        checkbox = entry
    } else if(isTreeNode(entry)){
        checkbox = getCheckboxByName(entry.name);
    } else {
        throw new Error('unknown type of entry')
    }

    return checkbox;
}

function getEffectBtn(entry: Entry) {
    let button: HTMLButtonElement;
    if (typeof entry === 'string') {
        button = getEffectButtonByName(entry);
    } else if (entry instanceof HTMLButtonElement) {
        button = entry
    } else if(isTreeNode(entry)){
        button = getEffectButtonByName(entry.name);
    } else {
        throw new Error('unknown type of entry')
    }
    return button;
}

function getToggleTreeBtn(entry: Entry) {
    let button: HTMLButtonElement;
    if (typeof entry === 'string') {
        button = getToggleBtnByName(entry);
    } else if (entry instanceof HTMLButtonElement) {
        button = entry
    } else if(isTreeNode(entry)){
        button = getToggleBtnByName(entry.name);
    } else {
        throw new Error('unknown type of entry')
    }
    return button;
}

function isTreeNode(nodeLike: any): nodeLike is TreeNode {
    return nodeLike && nodeLike.type && nodeLike.name
}

function clickCheckbox(entry: Entry) {
    let checkbox = getCheckbox(entry);
    fireEvent.click(checkbox);
}

function clickToggleTreeBtn(entry: Entry){
    const toggleBtn = getToggleTreeBtn(entry);
    fireEvent.click(toggleBtn);
}

function clickEffectBtn(entry: Entry) {
    const button = getEffectBtn(entry);
    fireEvent.click(button);
}


function expectRootNodeStatus(checked: boolean | 'indeterminate', collapsed: boolean) {
    clickEffectBtn(`show-root-status`);
    expectLogAreaMatch(`checked(${checked}),collapsed(${collapsed})`)
}

function expectLogAreaMatch(str: string | RegExp) {
    const logArea = screen.getByTestId(`log-area`);
    expect(logArea).toHaveTextContent(str);
}
