import React from 'react'
import {render, fireEvent, screen} from '@testing-library/react'

import  '@testing-library/jest-dom'
import Example1 from "../web-server-dev/examples/example1";

test(`test example 1`,async  () => {
    render(<Example1 />)

    await fireEvent.click(screen.getByText(`callA without hook`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);

    await fireEvent.click(screen.getByText(`Indirectly invoke "bark" of A by invoking "invokeA" of B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);


    await fireEvent.click(screen.getByText(`toggle B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:Root$/);
    await fireEvent.click(screen.getByText(`Indirectly invoke "bark" of A by invoking "invokeA" of B`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:indirect$/);
    await fireEvent.click(screen.getByText(`invoke A's bark`));
    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:B$/);

    await fireEvent.click(screen.getByText(`callA without hook`));

    expect(screen.getByRole(`alert`)).toHaveTextContent(/from:outer$/);
})
