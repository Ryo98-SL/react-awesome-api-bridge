import {DependencyList, RefObject} from "react";

interface APIOptions {
    isMulti?: boolean;
}




export type ResolvePartialAPI<A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = NonNullable<O[N]>['isMulti'] extends true ? Partial<A[N]>[] : Partial<A[N]>;


export type Bridge<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: {
        options?: O[N],
        api?: RefObject<ResolvePartialAPI< A, O, N>>,
    }
}
export type RootContext<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>;
    parent?: RootContext<A, O>;
    payload?: Payload;
} | null;
export type RootBoundaryProps<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    payload?: Payload;
    contextValue?: RootContext<A, O>;
}
export type RootBoundaryAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>,
    payload?: Payload;
    getAPI: <N extends keyof A>(name: N) => ResolvePartialAPI<A,O, N>,
    parent: RootContext<A, O> | undefined,
}
export type OnInit<A> = (api: A) => void;
export type BridgeAPIOptions<A extends APIParams> = Partial<Record<keyof A, APIOptions>>;

type Payload = any;
type APIParams = Record<string, any>;

export type GetAPIHookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>> = {
    onInit?: OnInit<ResolvePartialAPI< A, O, N>>,
} & BaseHookOptions<A, O>;

export type BaseHookOptions<A extends APIParams, O extends BridgeAPIOptions<A>> = {
    context?: RootContext<A, O>;
};