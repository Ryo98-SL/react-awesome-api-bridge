import {getIsMulti} from "./getIsMulti";
import {RefObject} from "react";
import {appendToMappedValue} from "../utils/appendToMappedValue";
import {tryInvoke} from "../utils/tryInvoke";
import {OnInit, OnMultiInit, ResolveInit} from "../types/init";
import {BridgeAPIOptions} from "../types/options";
import {APIParams, ResolveAPI} from "../types/api";
import {InitializedOnInitMap} from "../types/maps";

export function mountHookInitEffect<A extends APIParams, N extends keyof A, O extends BridgeAPIOptions<A>, ANL extends ResolveAPI<A, O, N>>
(name: N, onInit: ResolveInit<A, O, N> | undefined, apiNList: ANL, hookId: any, bridgeOptions: O | undefined, initializedOnInitMap: InitializedOnInitMap<A>) {
    if (!onInit) return;
    const isMulti = getIsMulti<A, N>(name, bridgeOptions) ?? false;
    const involvedApiList: RefObject<A[N]>[] = [];

    let deferFn: (() => void) | undefined;
    if (apiNList && !isMulti) {
        const _assertedApi = apiNList as RefObject<A[N]>;
        //Currently, no api exist, no need to call onInit
        if (!_assertedApi.current) return;
        const _assertedOnInit = onInit as OnInit<A, N>;

        deferFn = () => {
            return _assertedOnInit(_assertedApi)
        }

        involvedApiList.push(_assertedApi)
    } else if (apiNList && isMulti) {
        const _assertedApiList = apiNList as RefObject<A[N]>[];
        //Currently, no api exist, no need to call onInit
        if (!_assertedApiList.length) return;
        const _assertedOnInit = onInit as OnMultiInit<A, N>;

        deferFn = () => {
            return _assertedOnInit(undefined, _assertedApiList);
        }

        involvedApiList.push(..._assertedApiList);
    } else {
        throw new Error('This might the internal Error of react-api-bridge');
    }


    let clearFns: any[] = [];

    if (involvedApiList.some((apiRef) => !initializedOnInitMap.get(apiRef)?.includes(hookId))) {
        clearFns.push(
            deferFn?.(),
            ...involvedApiList.map((apiRef) => {
                // marked as  initialized, prevent duplicate invocation
                return appendToMappedValue(initializedOnInitMap, apiRef, hookId);
            })
        )
    }

    return () => {
        clearFns.forEach(tryInvoke);
    }
}