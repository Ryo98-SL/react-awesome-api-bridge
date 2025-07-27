import React, {forwardRef, PropsWithChildren, useContext, useImperativeHandle, useMemo} from "react";
import {getApiDesc} from "../../core";
import {BoundaryAPI, BoundaryContextValue, BoundaryProps} from "../../types/boundary";
import {BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {BridgeRegistry, ReactAPIBridge} from "../../types/bridge";

export default function createBoundary<A extends APIParams,P, O extends BridgeAPIOptions<A>>
(
    apiBridge: ReactAPIBridge<A, P, O>,
) {

    const Boundary = forwardRef<
        BoundaryAPI<A, O, P>,
        PropsWithChildren<BoundaryProps<A, P, O>>
    >((props, ref) => {
        const _ownBridge = useMemo(() => ({}), []);
        const bridge: BridgeRegistry<A, O> = props.contextValue?.bridge || _ownBridge;
        const paramParent = props.contextValue?.parent;
        const upperParent = useContext(apiBridge.BridgeContext);
        const parent = paramParent || upperParent;
        const _payload = props.contextValue?.payload ?? props.payload as P;
        useImperativeHandle(ref, () => {
            return {
                getAPI: (name) => {
                    return getApiDesc<A,typeof name, O>(name, bridge, apiBridge.bridgeOptions).apiNList;
                },
                parent,
                payload: _payload
            }
        }, [_payload]);

        const contextValue = useMemo(() => {
            const final: BoundaryContextValue<A, P, O> = {
                ...(props.contextValue || {
                    bridge,
                    parent,
                }),
                payload: _payload
            };

            return final
        }, [props.contextValue, _payload]);

        return <apiBridge.BridgeContext.Provider value={contextValue}>{props.children}</apiBridge.BridgeContext.Provider>
    });

    Boundary.displayName = 'Boundary';

    return Boundary;
}

