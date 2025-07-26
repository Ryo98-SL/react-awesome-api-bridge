import {BoundaryContextValue} from "../types/boundary";
import {AllAPI, BridgeAPIOptions, UpperOptions} from "../types/options";
import {APIParams} from "../types/api";

export function getUpperContextValue<A extends APIParams, O extends BridgeAPIOptions<A>, P>(
    start: BoundaryContextValue<A, P, O>,
    shouldForwardYield?: UpperOptions<A, O, P>['shouldForwardYield']
) {
    let parent = start.parent;
    while (true) {
        if (!parent) break;
        if (!shouldForwardYield) break;

        const apiNames = Object.keys(parent.bridge) as (keyof A)[];

        const allAPI = apiNames.reduce((all, apiName) => {
            const bridge = parent!.bridge[apiName]!;
            all[apiName] = bridge.apiNList
            return all;
        }, {} as AllAPI<A, O>)
        if (!!shouldForwardYield({
            payload: parent.payload,
            parent: parent.parent,
            allAPI
        })) break;
        parent = parent.parent;
    }

    return parent;
}