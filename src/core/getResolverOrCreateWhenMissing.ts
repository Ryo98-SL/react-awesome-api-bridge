import {BoundaryContextValue} from "../types/boundary";
import {BridgeAPIOptions} from "../types/options";
import {ApiNList, APIParams} from "../types/api";
import {BridgeResolver} from "../types/bridge";
import {PendingResolverMap} from "../types/maps";

export function getResolverOrCreateWhenMissing<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
(apiNList: ApiNList<A, O, N>, contextValue: BoundaryContextValue<A, P, O>, initial: boolean, pendingResolverMap: PendingResolverMap<A, O, P>) {


    const _getPendingContextMap =
        <N extends keyof A, >
    (_apiNList: ApiNList<A, O, N>) => {
        return pendingResolverMap.get(_apiNList) as Map<BoundaryContextValue<A, P, O>, BridgeResolver<A, O, N>[]> | undefined;
    }

    const _setPendingContextMap =
        <N extends keyof A, >
        (_apiNList: ApiNList<A, O, keyof A>, map: Map<BoundaryContextValue<A, P, O>, BridgeResolver<A, O, N>[]>) => {
        // @ts-ignore
        return pendingResolverMap.set(_apiNList, map);
    }


    let contextValueMap = _getPendingContextMap(apiNList);

    if (!contextValueMap) {
        contextValueMap = new Map<BoundaryContextValue<A, P, O>, BridgeResolver<A, O, N>[]>();
        _setPendingContextMap(apiNList, contextValueMap);
    }

    let resolvers = contextValueMap.get(contextValue);

    if (!resolvers) {
        resolvers = [];
        contextValueMap.set(contextValue, resolvers);
    }

    let resolver = resolvers.find(r => r.initial);

    if (!resolver || !initial) {
        let outerResolve: (_apiNList: typeof apiNList) => void;
        const newPromise = new Promise<typeof apiNList>(resolve => {
            outerResolve = resolve;
        });

        resolver = {
            initial,
            promise: newPromise,
            resolve: outerResolve!
        }

        resolvers.push(resolver);
    }


    return {
        resolver,
        contextValueMap,
        resolvers,
    };
}