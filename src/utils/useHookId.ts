import {useMemo} from "react";
import {genHookId} from "./genHookId";

import {HookId} from "../types/tools";

export function useHookId(): HookId {
    return useMemo(() => {
        return process.env.NODE_ENV === 'development' ? genHookId() : Symbol('hookId')
    }, []);
}

