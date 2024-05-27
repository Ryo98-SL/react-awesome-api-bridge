import React, {StrictMode} from 'react'
import {render, fireEvent, screen} from '@testing-library/react'

import  '@testing-library/jest-dom'
import Example1 from "../web-server-dev/examples/example1";
import ExampleMultiple, {id1} from "../web-server-dev/examples/example-multiple";

test(`test example 1`,async  () => {
    render(<Example1 />)

    fireEvent.click(screen.getByText(`callA without hook`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);

    fireEvent.click(screen.getByText(`Indirectly invoke "bark" of A by invoking "invokeA" of B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);

    fireEvent.click(screen.getByText(`toggle B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:Root$/);
    fireEvent.click(screen.getByText(`Indirectly invoke "bark" of A by invoking "invokeA" of B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:indirect$/);
    fireEvent.click(screen.getByText(`invoke A's bark`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:B$/);

    fireEvent.click(screen.getByText(`callA without hook`));

    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);
})

const byTestId = screen.getByTestId.bind(screen);
test(`test example multi`, async () => {

    render(<ExampleMultiple />);

    expect(byTestId(`${id1}mounted-b`)).toHaveTextContent(`01,02,03`);

    const aIndicator = byTestId(`${id1}-ab`);
    expect(aIndicator).toHaveTextContent(`01,02,03`);

    fireEvent.click(byTestId(`${id1}-03-intro-btn`));
    expect(byTestId(`03b`)).toHaveTextContent(`the 03 B introduced`);

    const b1Btn = byTestId(`${id1}01-intro-btn`);
    fireEvent.click(b1Btn);
    const b1Input = byTestId(`${id1}input-01`) as HTMLInputElement;
    const inputValue = b1Input.value;
    const b1Indicator = byTestId(`${id1}b-count-01`);
    expect(b1Indicator).toHaveTextContent(`${inputValue}-1`);
    fireEvent.change(b1Input, {target: {value: 'pop'}});
    fireEvent.click(b1Btn);
    expect(b1Indicator).toHaveTextContent(`pop-2`);

    fireEvent.click(byTestId(`${id1}b-delete-01`));
    expect(aIndicator).toHaveTextContent('02,03');
    fireEvent.click(byTestId(`${id1}b-delete-02`));
    expect(aIndicator).toHaveTextContent('03');


    fireEvent.change(byTestId(`input-outer`), {target: {value: '01'}});
    fireEvent.click(byTestId(`add-btn-outer`));

    expect(byTestId(`${id1}b-desc-01`)).toHaveTextContent(inputValue);
    expect(aIndicator).toHaveTextContent('03,01');

    fireEvent.click(byTestId(`toggleA-outer`));
    fireEvent.click(byTestId(`toggleA-outer`));

    const newAIndicator = byTestId(`${id1}-ab`);
    expect(newAIndicator).toHaveTextContent(`03,01`);

    const aIntro02Btn = byTestId(`${id1}-a-intro02b-btn`);
    fireEvent.click(aIntro02Btn);

    fireEvent.change(byTestId(`input-outer`), {target: {value: '02'}});
    fireEvent.click(byTestId(`add-btn-outer`));

    fireEvent.click(aIntro02Btn);

    expect(newAIndicator).toHaveTextContent(`03,01,02`);

    const aInput = byTestId(`${id1}a-input`);
    fireEvent.change(aInput, {target:{value: 'ryo'}})

    const singBtn = byTestId(`${id1}sing-btn`);
    fireEvent.click(singBtn);

    const sangIndicator = byTestId(`${id1}-a-sang`);
    expect(sangIndicator).toHaveTextContent(`${id1}-ryo-A-sang`);

})
