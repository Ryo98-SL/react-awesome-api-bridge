import React, {StrictMode} from 'react'
import {render, fireEvent, screen, act} from '@testing-library/react'
import '@testing-library/jest-dom'

import ExampleGetApi from "../web-server-dev/examples/example-getApi";

const byTestId = screen.getByTestId.bind(screen);

test('test init', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<ExampleGetApi/>);
    const globalNodes = getNodes('global');
    const innerNodes = getNodes('inner');
    const laterNodes = getNodes('later');

    expect(globalNodes.content).toHaveTextContent('global');
    expect(innerNodes.content).toHaveTextContent('kun-inner');
    expect(laterNodes.content).toHaveTextContent('kun-later');

    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith("Individual ikun");


    fireEvent.click(globalNodes.rapBtn);
    isRapping(globalNodes.rapping);
    fireEvent.click(globalNodes.hookRapBtn!);
    isRapping(globalNodes.rapping, true);


    fireEvent.click(innerNodes.rapGlobal!);
    isRapping(globalNodes.rapping);

    fireEvent.click(laterNodes.rapBtn);
    await Promise.resolve();
    expect(consoleSpy).toHaveBeenLastCalledWith('later rapping');
    await new Promise((resolve) => setTimeout(resolve, 100));
    isRapping(laterNodes.rapping);
    isRapping(innerNodes.rapping, true);

    fireEvent.click(innerNodes.rapBtn);
    await new Promise((resolve) => setTimeout(resolve, 100));
    isRapping(innerNodes.rapping);

    fireEvent.click(innerNodes.rapGlobal!);
    isRapping(globalNodes.rapping, true);

    fireEvent.click(laterNodes.rapGlobal!);
    isRapping(globalNodes.rapping, false);

    fireEvent.click(byTestId('kun-rap-btn-global-inner'));
    isRapping(innerNodes.rapping, true);
});

function isRapping(node: HTMLElement, inverse = false) {

    let ex = expect(node);

    if(inverse) {
        // @ts-ignore
        ex = ex.not;
    }

    ex.toHaveTextContent('rapping')
}


function getNodes(id: string) {


    return {
        rapBtn:byTestId(`kun-rap-btn-${id}`),
        rapping: byTestId(`kun-rapping-${id}`),
        content: byTestId(`kun-content-${id}`),
        hookRapBtn: id === 'global' ? byTestId(`kun-rap-btn-${id}-hook`) : null,
        rapGlobal: id === 'global' ? null : byTestId(`kun-rap-btn-${id}-global`)
    }
}