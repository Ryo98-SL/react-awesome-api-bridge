import {ResolveInit} from "./init";
import {BoundaryContextValue} from "./boundary";

import {APIParams, ResolveAPI} from "./api";

export interface APIOptions {
    isMulti?: boolean;
}

export type BridgeAPIOptions<A extends APIParams> = Partial<Record<keyof A, APIOptions>>;

export interface BaseOptions<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any> {
    contextValue?: BoundaryContextValue<A, P, O>;
}

export interface GetAPIOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P = any>
    extends BaseOptions<A, O, P> {
    onInit?: ResolveInit<A, O, N>;

}

export type AllAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    [N in keyof A]?: ResolveAPI<A, O, N> | undefined
};

export interface UpperOptions<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any>
    extends BaseOptions<A, O, P> {
    shouldForwardYield?: (boundaryDetail:
                              Pick<BoundaryContextValue<A, P, O>, 'payload' | 'parent'>
                              & {
                              allAPI: AllAPI<A, O>
                          }
    ) => any;
}

export interface GetUpperAPIOptions<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P = any>
    extends GetAPIOptions<A, N, O, P>, UpperOptions<A, O, P> {

}

export interface GetAPIAsyncOptions<A extends APIParams, O extends BridgeAPIOptions<A>, P = any> extends BaseOptions<A, O, P> {
    initial?: boolean;
}