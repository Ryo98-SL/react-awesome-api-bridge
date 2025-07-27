import {useFinalContextValue} from "../../core";
import {BaseOptions, BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function useBoundaryPayload<A extends APIParams, O extends BridgeAPIOptions<A>, P>(apiBridge: ReactAPIBridge<A, P, O>, hookOptions?: BaseOptions<A, O, P>) {
    const contextValue = useFinalContextValue(hookOptions, apiBridge.BridgeContext);
    return contextValue.payload;
}