import {render, fireEvent, screen, getByTestId, } from '@testing-library/react'
import '@testing-library/jest-dom'

import ExampleAsync from "../web-server-dev/examples/example-async";
const byTestId = screen.getByTestId.bind(screen);

test(`test example async`,async  () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExampleAsync/>);

    const globalNameBtn = byTestId('GlobalNameBtn');
    const joeNameBtn = byTestId('JoeNameBtn');
    const mikeNameBtn = byTestId('MikeNameBtn');

    const mikeRenewedNameBtn = byTestId('MikeRenewedNameBtn');
    const renewMikeNameBtn = byTestId('RenewMikeName');

    fireEvent.click(globalNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("name:",expect.stringContaining("DeliangShu"));

    fireEvent.click(joeNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).nthCalledWith(2, "name:", expect.stringContaining("Joe"));


    fireEvent.click(mikeNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(consoleSpy).nthCalledWith(3,"name:", expect.stringContaining("Mike"));

    fireEvent.click(mikeRenewedNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    await new Promise(resolve => setTimeout(resolve, 3001));
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("TimeOut"));

    fireEvent.click(mikeRenewedNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    fireEvent.click(renewMikeNameBtn);
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(consoleSpy).nthCalledWith(4, expect.stringContaining("none-initial name:Mike"));
})