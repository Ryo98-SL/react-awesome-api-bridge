import {useContext, useMemo} from "react";
import {BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {PayloadParameter} from "../../types/tools";
import {ReactAPIBridge} from "../../types/bridge";
import {BoundaryContextValue} from "../../types/boundary";


export function useBoundaryContext<A extends APIParams, O extends BridgeAPIOptions<A>, P>
(apiBridge: ReactAPIBridge<A, P, O>, ...args: PayloadParameter<P>) {
    const payload = args[0] as P;
    const parent = useContext(apiBridge.BridgeContext);
    return useMemo<BoundaryContextValue<A, P, O>>(() => {
        return {
            bridge: {},
            parent,
            payload
        }
    }, []);
}