import {useFinalContextValue, getUpperContextValue} from "../../core";
import {useMemo} from "react";
import {BridgeAPIOptions, UpperOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

function useUpperBoundaryPayload<A extends APIParams, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, hookOptions?: UpperOptions<A, O, P>) {
    const {shouldForwardYield} = hookOptions || {};
    const contextValue = useFinalContextValue(hookOptions, apiBridge.BridgeContext);

    const boundaryContextValue = useMemo(() => {
        return getUpperContextValue(contextValue, shouldForwardYield);
    }, []);

    return boundaryContextValue?.payload
}

export { useUpperBoundaryPayload };