import {ApiNList, APIParams, ResolveAPI} from "./api";
import {BridgeAPIOptions} from "./options";
import {BoundaryContextValue} from "./boundary";
import React from "react";
import {CacheInitCbMap, InitializedOnInitMap, PendingResolverMap} from "./maps";

export type BridgeRegistry<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: {
        options?: O[N],
        apiNList?: ResolveAPI<A, O, N>,
    }
}

export interface BridgeResolver<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> {
    initial: boolean;
    promise: Promise<ApiNList<A, O, N>>;
    resolve: (apiNList: ApiNList<A, O, N>) => void;
}

export interface ReactAPIBridge<A extends APIParams, P = any, O extends BridgeAPIOptions<A>> {
    globalContextValue: BoundaryContextValue<A, P, O>,
    BridgeContext: React.Context<BoundaryContextValue<A, P, O>>,
    cacheInitCbMap: CacheInitCbMap<A>,
    initializedOnInitMap: InitializedOnInitMap<A>,
    bridgeOptions: O | undefined,
    pendingResolverMap: PendingResolverMap<A, O, P>
}