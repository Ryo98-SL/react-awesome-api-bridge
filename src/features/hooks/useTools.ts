import {useFinalContextValue, getApiDesc, getUpperApiDesc, getUpperContextValue, getResolverOrCreateWhenMissing} from "../../core";
import {useCallback} from "react";
import {
    BaseOptions,
    BridgeAPIOptions,
    GetAPIAsyncOptions,
    GetUpperAPIOptions,
    UpperOptions
} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function useTools<A extends APIParams, P, O extends BridgeAPIOptions<A>>
(apiBridge: ReactAPIBridge<A, P, O>, hookOptions?: BaseOptions<A, O, P>) {


    const contextValue = useFinalContextValue(hookOptions, apiBridge.BridgeContext);

    const getAPI = useCallback(<N1 extends keyof A, >
    (_name: N1, options?: BaseOptions<A, O, P>) => {
        return getApiDesc(_name, options?.contextValue?.bridge || contextValue.bridge, apiBridge.bridgeOptions).apiNList;
    }, [contextValue.bridge]);

    const getBoundaryPayload = useCallback((options?: BaseOptions<A, O, P>) => {
        return (options?.contextValue || contextValue).payload;
    }, [contextValue.payload]);

    const getUpperAPI = useCallback(<N1 extends keyof A, >(
        _name: N1,
        options?: GetUpperAPIOptions<A, N1, O, P>
    ) => {
        return getUpperApiDesc<A, typeof _name, O, P>(options?.contextValue || contextValue, _name, options, apiBridge.bridgeOptions)?.apiNList;
    }, []);

    const getUpperBoundaryPayload = useCallback((
        options?: UpperOptions<A, O, P>
    ) => {
        const parent = getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
        if (!parent) return;
        return parent.payload;
    }, []);

    const getAPIAsync = <N1 extends keyof A>(_name: N1, options?: GetAPIAsyncOptions<A, O, P>) => {
        const {initial} = {
            initial: true,
            ...options,
        };

        const {apiNList} = getApiDesc(_name, (options?.contextValue || contextValue).bridge, apiBridge.bridgeOptions);
        const {resolver} = getResolverOrCreateWhenMissing(apiNList, contextValue, initial, apiBridge.pendingResolverMap);

        return resolver.promise;
    }

    return {
        getAPI,
        getBoundaryPayload,
        getUpperAPI,
        getUpperBoundaryPayload,
        getAPIAsync,
    }
}