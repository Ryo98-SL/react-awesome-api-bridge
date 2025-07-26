import {APIOptions, BridgeAPIOptions} from "./options";
import {RefObject} from "react";

export type MapMulti<O extends BridgeAPIOptions<APIParams>, N extends keyof O> = (NonNullable<O[N] & APIOptions>)['isMulti'];
export type ConditionByIsMulti<O extends BridgeAPIOptions<APIParams>, N extends keyof O, X1, X2> = MapMulti<O, N> extends true ? X1 : X2;
export type WrapList<O extends BridgeAPIOptions<APIParams>, N extends keyof O, B> = ConditionByIsMulti<O, N, B[], B>;
export type ResolveAPI<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = WrapList<O, N, RefObject<A[N]>>;
export type APIParams = object;
export type ApiNList<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = WrapList<O, N, RefObject<A[N]>>;