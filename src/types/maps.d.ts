import {ApiNList, APIParams} from "./api";
import {RefObject} from "react";
import {HookId} from "./tools";
import {BridgeAPIOptions} from "./options";
import {BoundaryContextValue} from "./boundary";
import {BridgeResolver} from "./bridge";

export type InitializedOnInitMap<A extends APIParams> = Map<RefObject<A[keyof A]>, HookId[]>;

export type CacheInitCbMap<A extends APIParams> = WeakMap<ApiNList<A, BridgeAPIOptions<A>, keyof A>, {
    onInit: Function
    hookId: HookId
}[]>
type PendingResolverMap<A extends APIParams, O extends BridgeAPIOptions<A>, P = any> = Map<ApiNList<A, O, keyof A>, Map<BoundaryContextValue<A, P, O>, BridgeResolver<A, O, keyof A>[]>>;