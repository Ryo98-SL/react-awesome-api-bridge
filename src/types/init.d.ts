import {RefObject} from "react";
import {BridgeAPIOptions} from "./options";
import {APIParams, ConditionByIsMulti} from "./api";

export type OnInit<A extends APIParams, N extends keyof A> = (api: RefObject<A[N]>) => any;
export type OnMultiInit<A extends APIParams, N extends keyof A> = (api: RefObject<A[N]> | undefined, total: RefObject<A[N]>[]) => any;
export type ResolveInit<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = ConditionByIsMulti<O, N, OnMultiInit<A, N>, OnInit<A, N>>;