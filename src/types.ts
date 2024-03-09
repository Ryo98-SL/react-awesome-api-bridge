import {DependencyList, RefObject} from "react";

export interface APIOptions {
    isMulti?: boolean;
}


export type UnifyToBoolean<T> = T extends true ? true : false;
export type MapMulti<O extends BridgeAPIOptions<APIParams>, N extends keyof O> = NonNullable<O[N]>['isMulti'];
export type ConditionByIsMulti<O extends BridgeAPIOptions<APIParams> , N extends keyof O, X1, X2> = MapMulti<O, N> extends true ? X1 : X2;


export type ResolveAPI<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = ConditionByIsMulti<O, N,  RefObject<A[N]>[], RefObject<A[N]>>;

export type Bridge<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: {
        options?: O[N],
        apiNList?: ResolveAPI<A, O, N>,
    }
}

export type BoundaryContextValue<A extends APIParams, P = any, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>;
    parent?: BoundaryContextValue<A,P, O>;
    payload?: P;
};
export type BoundaryProps<A extends APIParams, P = any, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    payload?: P;
    contextValue?: BoundaryContextValue<A,P, O>;
}
export type BoundaryAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any> = {
    bridge: Bridge<A, O>,
    payload?: P;
    getAPI: <N extends keyof A>(name: N) => ResolveAPI<A,O, N>,
    parent: BoundaryContextValue<A, P, O> | undefined,
}
export type OnInit<A extends APIParams, N extends keyof A> =  (api: RefObject<A[N]>) => void;

export type OnMultiInit<A extends APIParams, N extends keyof A> = (api: RefObject<A[N]> | undefined, total: RefObject<A[N]>[]) => void;

export type ResolveInit<A extends APIParams, O extends BridgeAPIOptions<A>,  N extends keyof A> = ConditionByIsMulti<O, N, OnMultiInit<A, N>, OnInit<A, N>>;

export type BridgeAPIOptions<A extends APIParams> = Partial<Record<keyof A, APIOptions>>;

export type APIParams = Record<string, any>;

export interface BaseHookOptions<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any> {
    contextValue?: BoundaryContextValue<A, P, O>;
}

export interface GetAPIHookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P = any> extends BaseHookOptions<A, O, P>{
    onInit?:  ResolveInit<A, O, N>;

};

export interface UpperHookOptions<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any> {
    onBoundaryForward?: (contextValue: BoundaryContextValue<A ,P ,O>, next: () => void) => void
}

export interface GetUpperAPIHookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P = any> extends Omit<GetAPIHookOptions<A, N, O, P>, 'contextValue'>, UpperHookOptions<A, O, P>
{

}


type ResetReturn<F, NR> = F extends (...args:infer P) => any ? (...args: P) => NR : F;

export interface HookId {

}
