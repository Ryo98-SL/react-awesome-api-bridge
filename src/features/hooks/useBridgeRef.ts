import {useRef} from "react";
import {BoundaryAPI} from "../../types/boundary";
import {BridgeAPIOptions} from "../../types/options";
import {APIParams} from "../../types/api";
import {ReactAPIBridge} from "../../types/bridge";

export function useBoundaryRef<A extends APIParams, O extends BridgeAPIOptions<A>, P>(apiBridge: ReactAPIBridge<A, P, O>) {
    return useRef<BoundaryAPI<A, O, P>>(null);
}