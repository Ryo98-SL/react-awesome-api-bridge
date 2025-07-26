import {getIsMulti} from "./getIsMulti";
import {createRef, RefObject} from "react";
import {BridgeAPIOptions} from "../types/options";
import {ApiNList, APIParams} from "../types/api";
import {BridgeRegistry} from "../types/bridge";

export const getApiDesc = <A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>>
(name: N, source: BridgeRegistry<A, O>, bridgeOptions: O | undefined) => {
    let isInitial = false;
    if (!source[name]) {
        isInitial = true;
        const isMulti = getIsMulti<A, N>(name, bridgeOptions);
        const apiNList = (isMulti ? [] as RefObject<A[N]>[]
            : createRef<A[N]>()) as ApiNList<A, O, N>;

        source[name] = {
            options: bridgeOptions?.[name],
            apiNList: apiNList,
        }
    }

    return {apiNList: source[name]!.apiNList!, isInitial};
}


