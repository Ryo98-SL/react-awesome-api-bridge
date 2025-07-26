import {createContext} from "react";
import {BoundaryContextValue} from "../types/boundary";
import {BridgeAPIOptions} from "../types/options";
import {ApiNList, APIParams} from "../types/api";
import {CacheInitCbMap, InitializedOnInitMap, PendingResolverMap} from "../types/maps";
import {BridgeResolver, ReactAPIBridge} from "../types/bridge";

export function genOutput<A extends APIParams, P = any, const O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>>
(payload: P, bridgeOptions?: O): ReactAPIBridge<A, P, O> {

    const globalContextValue: BoundaryContextValue<A, P, O> = {
        bridge: {},
        parent: undefined,
        payload
    };

    const BridgeContext = createContext(globalContextValue);

    // use to cache the onInit callback of useAPI and useUpperAPI.
    const cacheInitCbMap: CacheInitCbMap<A> = new WeakMap();

    // use to store initialized useAPI or useAPIUpper
    const initializedOnInitMap: InitializedOnInitMap<A> = new Map();

    // use to store resolvers for getting async api
    const pendingResolverMap: PendingResolverMap<A, O, P> = new Map();



    const output = {
        initializedOnInitMap,
        cacheInitCbMap,
        bridgeOptions,
        BridgeContext,
        globalContextValue,
        pendingResolverMap
    };


    Object.setPrototypeOf(output, null);
    Object.freeze(output);

    return output
}