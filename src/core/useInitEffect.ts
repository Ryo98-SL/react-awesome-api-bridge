import {useHookId} from "../utils/useHookId";
import {useEffect} from "react";
import {appendToMappedValue} from "../utils/appendToMappedValue";
import {removeArrayElement} from "../utils/removeArrayElement";
import {mountHookInitEffect} from "./mountHookInitEffect";
import {BoundaryContextValue} from "../types/boundary";
import {ResolveInit} from "../types/init";
import {BridgeAPIOptions} from "../types/options";
import {APIParams, ResolveAPI} from "../types/api";
import {CacheInitCbMap, InitializedOnInitMap} from "../types/maps";


export function useInitEffect<
    A extends APIParams,
    N extends keyof A,
    O extends BridgeAPIOptions<A>,
    P,
    ANL extends ResolveAPI<A, O, N>
>(
    onInit: ResolveInit<A, O, N> | undefined,
    name: N,
    apiNList: ANL,
    contextValue: BoundaryContextValue<A, P, O>,
    cacheInitCbMap: CacheInitCbMap<A>,
    bridgeOptions: O | undefined,
    initializedOnInitMap: InitializedOnInitMap<A>,
) {
    const hookId = useHookId();

    useEffect(() => {
        if (!onInit) return;
        // cache onInit associated with hookId, then it will be invoked subsequently.
        const removeCache = appendToMappedValue(cacheInitCbMap, apiNList, {onInit, hookId});
        const clearInitEffect = mountHookInitEffect(name, onInit, apiNList, hookId, bridgeOptions, initializedOnInitMap);

        return () => {
            removeCache();
            clearInitEffect?.()
        }
    }, []);

    // update onInit callback
    useEffect(() => {
        if (!onInit) return;
        const cacheCbs = cacheInitCbMap.get(apiNList);
        cacheCbs?.forEach((couple) => {
            if (couple.hookId === hookId) {
                couple.onInit = onInit;
            }
        });
    }, [onInit]);

    // remove callback when unmount
    useEffect(() => {
        return () => {
            initializedOnInitMap.forEach((arr, key) => {
                removeArrayElement(arr, hookId);
            });
        }
    }, []);
}



