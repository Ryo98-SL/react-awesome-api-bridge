import {useFinalContextValue, getApiDesc, useInitEffect} from "../../core";
import {BridgeAPIOptions, GetAPIOptions} from "../../types/options";
import {APIParams, ConditionByIsMulti} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function useAPI<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, name: N, hookOptions?: GetAPIOptions<A, N, O, P>) {
    const {onInit} = hookOptions || {};
    const contextValue = useFinalContextValue(hookOptions, apiBridge.BridgeContext);
    const {apiNList} = getApiDesc(name, contextValue!.bridge, apiBridge.bridgeOptions);
    useInitEffect(onInit, name, apiNList, contextValue, apiBridge.cacheInitCbMap, apiBridge.bridgeOptions, apiBridge.initializedOnInitMap);

    return apiNList;
}