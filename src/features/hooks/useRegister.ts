import {DependencyList, RefObject, useEffect, useImperativeHandle, useMemo} from "react";
import {getIsMulti, useFinalContextValue, getApiDesc, getResolverOrCreateWhenMissing} from "../../core";
import {useUniqueElementRef} from "../../utils/useUniqueElementRef";
import {appendToMappedValue} from "../../utils/appendToMappedValue";
import {tryInvoke} from "../../utils/tryInvoke";
import {OnInit, OnMultiInit} from "../../types/init";
import {BaseOptions, BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function useRegister<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, name: N, init: () => A[N], deps?: DependencyList, hookOptions?: BaseOptions<A, O, P>) {

    const isMulti = getIsMulti<A, N>(name, apiBridge.bridgeOptions);
    const contextValue = useFinalContextValue<A,N, O, P>(hookOptions, apiBridge.BridgeContext);
    const {apiNList} = useMemo(() => getApiDesc(name, contextValue!.bridge, apiBridge.bridgeOptions), [name, contextValue]);

    const apiRef = useUniqueElementRef(apiNList);

    useImperativeHandle(apiRef, () => {
        return init();
    }, deps);
    useEffect(() => {
        let clearFns: any[] = [];

        const {
            resolvers,
            resolver: initialResolver
        } = getResolverOrCreateWhenMissing(apiNList, contextValue, true, apiBridge.pendingResolverMap);

        resolvers.forEach((resolver) => {
            resolver.resolve(apiNList);
        });

        resolvers.length = 0;
        resolvers.push(initialResolver);


        const callbacks = apiBridge.cacheInitCbMap.get(apiNList);
        callbacks?.filter((initInfo) => {
            return !apiBridge.initializedOnInitMap.get(apiRef)?.includes(initInfo.hookId)
        })
            .forEach(initInfo => {
                clearFns.push(appendToMappedValue(apiBridge.initializedOnInitMap, apiRef, initInfo.hookId));

                const onInit = initInfo.onInit;
                if (isMulti) {
                    const _assertedOnInit = onInit as OnMultiInit<A, keyof A>;
                    clearFns.push(_assertedOnInit(apiRef, apiNList as RefObject<A[keyof A]>[]))
                } else {
                    const _assertedOnInit = onInit as OnInit<A, keyof A>;
                    clearFns.push(_assertedOnInit(apiRef))
                }
            });

        return () => {
            clearFns.forEach(tryInvoke);
            apiBridge.initializedOnInitMap.delete(apiRef);
        }
    }, []);
}