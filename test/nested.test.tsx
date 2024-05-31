import React, {StrictMode} from 'react'

import {render, fireEvent, screen, act} from '@testing-library/react'
import '@testing-library/jest-dom'
import ExampleNested from "../web-server-dev/examples/example-nested";

const byTestId = screen.getByTestId.bind(screen);
test(`nested test`, async () => {
    render(<ExampleNested/>)
    const eShowBtn = byTestId(`e-show-btn`);
    const eStatCountNode = byTestId(`e-stat-count`);
    const eAllShoutBtn = byTestId(`e-make-shout`);
    const eLogArea = byTestId(`e-log-area`);
    const aShoutAvailableCountNode = byTestId(`a-stat-count`);

    const toggleBBtn = byTestId(`toggle-b`);
    const toggleDBtn = byTestId(`toggle-d`);
    const rootShowCountNode = byTestId(`root-show-count`);



    expect(aShoutAvailableCountNode).toHaveTextContent(`0`);

    expect(eStatCountNode).toHaveTextContent(`0,2`);
    click(toggleBBtn);
    expect(eStatCountNode).toHaveTextContent(`0,2`);
    click(toggleBBtn);
    expect(eStatCountNode).toHaveTextContent(`0,3`);
    click(toggleDBtn);
    expect(eLogArea).toHaveTextContent(`showing`)
    expect(eStatCountNode).toHaveTextContent(`0,4`);
    click(toggleDBtn);
    expect(eLogArea).toHaveTextContent(`unmount`)
    expect(eStatCountNode).toHaveTextContent(`0,3`);
    click(toggleDBtn);
    expect(eStatCountNode).toHaveTextContent(`0,4`);

    expect(aShoutAvailableCountNode).toHaveTextContent(`0`);

    const dShoutCountNode = byTestId(`d-shout-count`);
    const dShowCountNode = byTestId(`d-show-count`);

    clickCShowBtn(`rc`);
    expectCStatus(`rc`, ``, ``);
    clickCShowPayloads(`rc`);
    expectCStatus(`rc`, `upper(undefined)(root payload)`, ``);

    clickCShowBtn(`bc`);
    clickCShowPayloads(`bc`);
    expectCStatus(`bc`, `upper(B upper payload)(B boundary payload)`, `root-show`);

    clickCShowBtn(`nc`);
    clickCShowPayloads(`nc`);
    expectCStatus(`nc`, `upper(root payload)(C upper payload)`, `root-show`);


    click(eShowBtn);
    click(eAllShoutBtn);

    const bShoutCountNode = byTestId(`b-shout-count`);
    const bShowCountNode = byTestId(`b-show-count`);

    expect(rootShowCountNode).toHaveTextContent(`2`);
    expect(bShowCountNode).toHaveTextContent(`0`);

    expect(bShoutCountNode).toHaveTextContent(`1`);
    expect(dShoutCountNode).toHaveTextContent(`1`);
    expect(dShowCountNode).toHaveTextContent(`1`);

    expect(eStatCountNode).toHaveTextContent(`1,4`);

    click(eAllShoutBtn);
    expect(eStatCountNode).toHaveTextContent(`2,4`);
    expect(dShoutCountNode).toHaveTextContent(`2`);
    expect(bShoutCountNode).toHaveTextContent(`2`);


})


function clickCShowBtn(id: string) {
   fireEvent.click(byTestId(`c-${id}-show`));

}

function clickCShowPayloads(id: string) {
    fireEvent.click(byTestId(`c-${id}-show-payloads`));

}

function expectCStatus(id: string, payloadText: string, showText: string) {
    const payloadNode = byTestId(`c-${id}-payload`);
    const showContentNode = byTestId(`c-${id}-show-content`);

    expect(payloadNode).toHaveTextContent(payloadText);
    expect(showContentNode).toHaveTextContent(showText);
}

function click(node: HTMLElement) {
    fireEvent.click(node);
}
