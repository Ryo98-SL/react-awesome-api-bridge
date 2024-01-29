import {DependencyList, RefObject} from "react";

interface APIOptions {
    isMulti?: boolean;
}


export type MapMulti<O extends BridgeAPIOptions<APIParams>, N extends keyof O> = NonNullable<O[N]>['isMulti'];
export type ConditionByIsMulti<O extends BridgeAPIOptions<APIParams> , N extends keyof O, X1, X2> = MapMulti<O, N> extends true ? X1 : X2;



type ResolveAPI<A extends APIParams, O extends BridgeAPIOptions<A>, N> = ConditionByIsMulti<O, N, Partial<A[N]>[], Partial<A[N]>>;

export type Bridge<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: {
        options?: O[N],
        api?: ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>> ,
        _proxy: ResolveAPI<A, O, N>
    }
}

export type RootContextValue<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>;
    parent?: RootContextValue<A, O>;
    payload?: Payload;
} | null;
export type RootBoundaryProps<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    payload?: Payload;
    contextValue?: RootContextValue<A, O>;
}
export type RootBoundaryAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>,
    payload?: Payload;
    getAPI: <N extends keyof A>(name: N) => ResolveAPI<A,O, N>,
    parent: RootContextValue<A, O> | undefined,
}
export type OnInit<_A, M extends boolean | undefined> = M extends true ? (api?:_A, others: _A[]) => void : (api: _A) => void;

export type BridgeAPIOptions<A extends APIParams> = Partial<Record<keyof A, APIOptions>>;

type Payload = any;
type APIParams = Record<string, any>;

export type GetAPIHookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>> = {
        onInit?:  ConditionByIsMulti< O, N, OnInit<Partial<A[N]>, true>, OnInit<Partial<A[N]>, false> >
    }
    & BaseHookOptions<A, O>;

export type BaseHookOptions<A extends APIParams, O extends BridgeAPIOptions<A>> = {
    contextValue?: RootContextValue<A, O>;
};