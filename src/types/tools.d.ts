import {BoundaryContextValue} from "./boundary";

import {ReactAPIBridge} from "./bridge";

export type ExtractContextValue<B> = B extends ReactAPIBridge<infer A> ? B extends ReactAPIBridge<A, infer P> ? BoundaryContextValue<A, P> : never : never;
export type HookId = string | symbol;
export type PayloadParameter<T> = undefined extends T ? [payload?: T] : [payload: T];