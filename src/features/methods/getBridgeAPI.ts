import {getApiDesc} from "../../core/getApiDesc";
import {BoundaryContextValue} from "../../types/boundary";
import {BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function getBridgeAPI<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, name: N, contextValue: BoundaryContextValue<A, P, O> = apiBridge.globalContextValue) {
    return getApiDesc(name, contextValue.bridge, apiBridge.bridgeOptions).apiNList;
}