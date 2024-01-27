import createBridge from "../bridge";


function ExampleMultiple() {

}



const EMBridge = createBridge<
    {
        A: {
            sing():void;
        },
        B: {
            perform(): void;
        }
    }
>()({
    B: {
        isMulti: true
    }
})