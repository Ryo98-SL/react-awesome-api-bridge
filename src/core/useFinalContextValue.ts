import {useContext} from "react";
import {BoundaryContextValue} from "../types/boundary";
import {BridgeAPIOptions, GetUpperAPIOptions} from "../types/options";
import {APIParams} from "../types/api";

export const useFinalContextValue =
    <A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, P>
    (
        options: GetUpperAPIOptions<A, N, O, P> | undefined,
        bridgeContext: React.Context<BoundaryContextValue<A, P, O>>
    ) => {
        const {contextValue: _outerContextValue} = options || {};
        const ownContextValue = useContext(bridgeContext);
        return _outerContextValue || ownContextValue;
    }