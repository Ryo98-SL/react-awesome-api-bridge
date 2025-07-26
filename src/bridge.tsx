import {genOutput} from "./core/genOutput";
import {BridgeAPIOptions} from "./types/options";
import {APIParams} from "./types/api";
import {PayloadParameter} from "./types/tools";

const createBridge = <
    A extends APIParams,
    P extends any = any
>(...args: PayloadParameter<P>) => {
    const payload = args[0] as P;

    const output = genOutput<A, P>(payload);
    const currying = <O extends BridgeAPIOptions<A>>(options?: O) => {
        return genOutput<A, P, O>(payload, options);
    };


    return Object.assign(currying, output);
};

export default createBridge;
