import {BridgeAPIOptions} from "./options";
import {APIParams, ResolveAPI} from "./api";
import {BridgeRegistry} from "./bridge";

export type BoundaryContextValue<A extends APIParams, P = any, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> = {
    bridge: BridgeRegistry<A, O>;
    parent?: BoundaryContextValue<A, P, O>;
    payload: P;
};
export type BoundaryProps<A extends APIParams, P = any, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>> =
    undefined extends P ? {
        contextValue?: BoundaryContextValue<A, P, O>;
        payload?: P;
    } : (
        | {
        payload: P,
        contextValue?: BoundaryContextValue<A, P, O>;
    }
        | {
        contextValue: BoundaryContextValue<A, P, O>;
        payload?: P,
    });
export type BoundaryAPI<A extends APIParams, O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>, P = any> = {
    payload: P;
    getAPI: <N extends keyof A>(name: N) => ResolveAPI<A, O, N>,
    parent: BoundaryContextValue<A, P, O> | undefined,
}