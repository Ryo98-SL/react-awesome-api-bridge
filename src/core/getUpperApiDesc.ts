import {getUpperContextValue} from "./getUpperContextValue";
import {getApiDesc} from "./getApiDesc";
import {BoundaryContextValue} from "../types/boundary";
import {BridgeAPIOptions, GetUpperAPIOptions} from "../types/options";
import {APIParams} from "../types/api";

export function getUpperApiDesc<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>(contextValue: BoundaryContextValue<A, P, O>,
                                                                           _name: N,
                                                                           options: GetUpperAPIOptions<A, N, O, P> | undefined,
                                                                           bridgeOptions: O | undefined
) {
    const parent = getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
    if (!parent) return;
    return getApiDesc(_name, parent.bridge, bridgeOptions);
}