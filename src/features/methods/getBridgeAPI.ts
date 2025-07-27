import {getApiDesc} from "../../core";
import {BoundaryContextValue} from "../../types/boundary";
import {BaseOptions, BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function getBridgeAPI<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, name: N, baseOptions?: BaseOptions<A, O, P>) {

    const contextValue = baseOptions?.contextValue || apiBridge.globalContextValue;
    return getApiDesc<A, N, O>(name, contextValue.bridge , apiBridge.bridgeOptions).apiNList;
}