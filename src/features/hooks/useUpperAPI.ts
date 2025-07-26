import {useFinalContextValue} from "../../core/useFinalContextValue";
import {useMemo} from "react";
import {getUpperApiDesc} from "../../core/getUpperApiDesc";
import {useInitEffect} from "../../core/useInitEffect";
import {BridgeAPIOptions, GetUpperAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

function useUpperAPI<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, name: N, hookOptions?: GetUpperAPIOptions<A, N, O, P>, bridgeOptions?: O) {
    const {
        onInit
    } = hookOptions || {};

    const contextValue = useFinalContextValue<A, N, O, P>(hookOptions, apiBridge.BridgeContext);

    const _apiNList = useMemo(() => {
        return getUpperApiDesc<A, typeof name, O, P>(contextValue, name, hookOptions, bridgeOptions)?.apiNList;
    }, []);
    if (!_apiNList) return;

    useInitEffect(onInit, name, _apiNList, contextValue, apiBridge.cacheInitCbMap, bridgeOptions, apiBridge.initializedOnInitMap);

    return _apiNList;
}

export { useUpperAPI };