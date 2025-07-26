import {BridgeAPIOptions} from "../types/options";
import {APIParams} from "../types/api";

export const getIsMulti = <A extends APIParams, N extends keyof A>
(name: N, bridgeOptions: BridgeAPIOptions<A> | undefined) => {
    return bridgeOptions?.[name]?.isMulti
}