import {DependencyList, RefObject} from "react";

interface APIOptions {
    isMulti?: boolean;
}

export type Bridge<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: {
        options?: O[N],
        api?: RefObject<A[N]>,
    }
}
export type RootContext<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>,
    parent?: RootContext<A, O>,
    key?: PropertyKey;
} | null;
export type RootBoundaryProps<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    payload?: Payload;
    contextValue?: RootContext<A, O>;
    key?: PropertyKey;
}
export type RootBoundaryAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: Bridge<A, O>,
    payload?: Payload;
    getAPI: <N extends keyof A>(name: N) => Partial<A[N]>,
    parent: RootContext<A, O> | undefined,
}
export type OnInit<A> = (api: A) => void;
export type BridgeAPIOptions<A extends APIParams> = Partial<Record<keyof A, APIOptions>>;

type Payload = any;
type APIParams = Record<string, any>;

export type HookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>> = {
    onInit?: OnInit<Partial<A[N]>>,
    context?: RootContext<A, O>
};

export type RegisterHookOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>> = {
    context?: RootContext<A, O>;
};