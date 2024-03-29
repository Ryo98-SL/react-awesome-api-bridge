import React, {
    createContext,
    createRef,
    DependencyList,
    forwardRef,
    PropsWithChildren,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef
} from "react";
import {
    APIParams,
    BaseOptions,
    BoundaryAPI,
    BoundaryContextValue,
    BoundaryProps,
    Bridge,
    BridgeAPIOptions,
    ConditionByIsMulti,
    GetAPIOptions,
    GetUpperAPIOptions,
    HookId,
    OnInit, OnMultiInit,
    ResolveAPI, ResolveInit,
    UpperOptions
} from "./types";

const createBridge = <
    A extends APIParams,
    P = any
>() => {
    const output = genOutput<A, P>();
    const currying = <O extends BridgeAPIOptions<A>>(options?: O) => {
        return genOutput<A, P, O>(options);
    };

    return Object.assign(currying, output);
};

export default createBridge;

function genOutput<A extends APIParams,P = any, const O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>>(bridgeOptions?: O) {
    const BridgeContext = createContext<BoundaryContextValue<A,P,O>>({
        bridge: {},
        parent: undefined,
    });

    const cacheInitCbMap = new WeakMap<any, {
        onInit: Function;
        hookId: any;
    }[]>();

    function getIsMulti<N extends keyof A>(name: N) {
        return bridgeOptions?.[name]?.isMulti
    }

    const _getApiDesc = <N extends keyof A>(name: N, source: Bridge<A, O>, silent = false) => {
        let isInitial = false;
        if(!source[name] && !silent) {
            isInitial = true;
            const isMulti = getIsMulti(name);
            const apiNList = ( isMulti ? [] as RefObject<A[N]>[]
                : createRef<A[N]>() ) as ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>>;

            source[name] = {
                options: bridgeOptions?.[name],
                apiNList: apiNList,
            }
        }

        return { apiNList: source[name]!.apiNList!, isInitial};
    }


    const Boundary = forwardRef<
        BoundaryAPI<A, O, P>,
        PropsWithChildren<BoundaryProps<A,P, O>>
    >((props, ref) => {
        const _ownBridge = useMemo(() => ({}), []);
        const bridge: Bridge<A, O> = props.contextValue?.bridge || _ownBridge;
        const paramParent = props.contextValue?.parent;
        const upperParent = useContext(BridgeContext);
        const parent = paramParent || upperParent;
        useImperativeHandle(ref, () => {
            return {
                getAPI: (name) => {
                    return _getApiDesc(name, bridge).apiNList;
                },
                parent,
                payload: props.payload
            }
        },[props.payload]);

        const contextValue = useMemo(() => {
            const final: BoundaryContextValue<A,P,O> = {
                ...(props.contextValue || {
                    bridge,
                    parent,
                }),
                payload: props.payload
            };

            return final
        }, [props.contextValue, props.payload]);

        return <BridgeContext.Provider value={contextValue}>{props.children}</BridgeContext.Provider>
    });
    Boundary.displayName = 'Boundary';

    const useFinalContextValue = <N1 extends keyof A>(options?: GetUpperAPIOptions<A, N1, O, P>) => {
        const {contextValue: _outerContextValue} = options || {};
        const ownContextValue = useContext(BridgeContext);
        return _outerContextValue || ownContextValue;
    }

    const initializedCallbacksMap = new Map<RefObject<A[keyof A]>, HookId[]>();

    function mountHookInitEffect<N extends keyof A, ANL extends ResolveAPI<A, O, N>>
    (name: N, onInit: ResolveInit<A, O, N> | undefined, apiNList: ANL, hookId: any) {
        if(!onInit) return;
        let clearEffectCallback: any;
        const isMulti = getIsMulti(name) ?? false;
        const involvedApiList: RefObject<A[N]>[] = [];
        // cache callback for subsequent register apiNList

        let unHandle = false;
        let deferFn: (() => void) | undefined;
        if (apiNList && !isMulti) {
            const _assertedApi = apiNList as RefObject< A[N]>;
            const _assertedOnInit = onInit as OnInit<A, N>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(_assertedApi);
            }

            involvedApiList.push(_assertedApi)
        } else if(apiNList && Array.isArray(apiNList) && isMulti){
            const _assertedApiList = apiNList as RefObject<A[N]>[];
            const _assertedOnInit = onInit as OnMultiInit<A, N>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(undefined, _assertedApiList);
            }

            involvedApiList.push(..._assertedApiList);
        } else {
            unHandle = true;
        }

        if(!unHandle && involvedApiList.every((apiRef) => !initializedCallbacksMap.get(apiRef)?.includes(hookId) )) {
            deferFn?.();
            /**
             * record initialized callbacks' correspond hookId against the api which it receives, ensure the callback will
             * not call again during current lifecycle of the component which include "useAPI" hook.
             * the returned clear function need to be called when component destroy.
             */
            involvedApiList.forEach((apiRef) => {
                appendToMappedValue(initializedCallbacksMap, apiRef , hookId);
            });
        }

        return () => {
            tryInvoke(clearEffectCallback);
        }
    }

    function useInitEffect<
        N extends keyof A,
        ANL extends ResolveAPI<A, O, N>
    >(
        onInit: ResolveInit<A, O, N> | undefined,
        name: N,
        apiNList: ANL,
        contextValue: BoundaryContextValue<A, P, O>
    ) {
        const hookId = useHookId();

        useEffect(() => {
            if (!onInit) return;
            return mountHookInitEffect(name, onInit, apiNList, hookId);
        }, [name, onInit, contextValue]);

        useEffect(() => {
            if (!onInit) return;
            const removeCachedCallback = appendToMappedValue(cacheInitCbMap, apiNList, {onInit, hookId});

            return () => {
                removeCachedCallback();
            }
        }, []);

        // update onInit callback
        useEffect(() => {
            if (!onInit) return;
            const cacheCbs = cacheInitCbMap.get(apiNList);
            cacheCbs?.forEach((couple) => {
                if (couple.hookId === hookId) return {onInit, hookId};
                return couple
            });
        }, [onInit]);

        useEffect(() => {
            return () => {
                initializedCallbacksMap.forEach((arr, key) => {
                    removeArrayElement(arr, hookId);
                });
            }
        }, []);
    }

    function _getUpperContextValue(
        start: BoundaryContextValue<A,P, O>,
        shouldForwardYield?: UpperOptions<A, O, P>['shouldForwardYield']
    )
    {
        let parent = start.parent;
        while (true) {
            if(!parent) break;
            parent = parent.parent;
            if(!shouldForwardYield || !parent) break;

            if (!!shouldForwardYield(parent)) break;
        }
        return parent;
    }


    function _getUpperApiDesc< N1 extends keyof A>(contextValue: BoundaryContextValue<A, P, O>,
                                                   _name: N1,
                                                   options?: GetUpperAPIOptions<A, N1, O>,) {
        const parent = _getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
        if (!parent) return;
        return _getApiDesc(_name, parent.bridge);
    }

    return {
        Boundary,
        createContextValue(): BoundaryContextValue<A, P, O> {
            return {
                bridge: {},
            };
        },
        initCbMap: cacheInitCbMap,
        initializedCallbacksMap,
        useAPI: <N extends keyof A, >(name: N, hookOptions?: GetAPIOptions<A, N, O>) => {
            const {onInit} = hookOptions || {};
            const contextValue = useFinalContextValue(hookOptions);
            const { apiNList} = _getApiDesc(name, contextValue!.bridge);
            useInitEffect(onInit, name, apiNList, contextValue);

            return apiNList;
        },
        useBoundaryPayload: (hookOptions?: BaseOptions<A, O, P>) => {
            const contextValue = useFinalContextValue(hookOptions);
            return contextValue.payload;
        },
        useBoundaryRef: () => {
            return useRef<BoundaryAPI<A, O, P>>(null);
        },
        useChildContextValue: (): BoundaryContextValue<A, P, O> => {
            const parent = useContext(BridgeContext);
            return useMemo(() => {
                return {
                    bridge: {},
                    parent
                }
            }, []);
        },
        useContextValue() {
            return useContext(BridgeContext);
        },
        useRegister: <N extends keyof A, T extends A[N]>(name: N, init: () => T, deps?: DependencyList, hookOptions?: BaseOptions<A, O>) => {
            const isMulti = getIsMulti(name);
            const contextValue = useFinalContextValue(hookOptions);
            const {apiNList} = useMemo(() => _getApiDesc(name, contextValue!.bridge),[name, contextValue]);

            const apiRef = useUniqueElementRef(apiNList);
            const hasInitialized = useRef(false);

            //init effect ---- start
            useImperativeHandle(apiRef, () => {
                return init();
            }, deps);
            useEffect(() => {
                if (!hasInitialized.current) {
                    const callbacks = cacheInitCbMap.get(apiNList);
                    const deferFnList = callbacks?.filter((initInfo) => {
                        return !initializedCallbacksMap.get(apiRef)?.includes(initInfo.hookId)
                    })
                        .map( initInfo => {
                            appendToMappedValue(initializedCallbacksMap, apiRef, initInfo.hookId);
                            const onInit = initInfo.onInit;
                            if (isMulti) {
                                const _assertedOnInit = onInit as OnMultiInit<A, N>
                                return () => _assertedOnInit(apiRef.current!, apiNList as RefObject<A[N]>[]);
                            } else {
                                const _assertedOnInit = onInit as OnInit<A, N>;

                                return () => _assertedOnInit(apiRef.current!);
                            }
                        });

                    const clearEffectCallbacks = deferFnList?.map(fn => fn());

                    hasInitialized.current = true;

                    return () => {
                        clearEffectCallbacks?.forEach(tryInvoke);
                    }
                }

            }, deps);
            useEffect(() => {
                return () => {
                    hasInitialized.current = false;
                    initializedCallbacksMap.delete(apiRef);
                }
            }, []);
            //init effect ---- end
        },
        useTools: (hookOptions?: BaseOptions<A, O, P>) => {
            const contextValue = useFinalContextValue(hookOptions);

            const getAPI = useCallback(<N1 extends keyof A, >
            (_name: N1, options?: BaseOptions<A, O, P>) => {
                return _getApiDesc(_name, options?.contextValue?.bridge || contextValue.bridge).apiNList;
            }, [contextValue.bridge]);

            const getBoundaryPayload = useCallback((options?: BaseOptions<A, O, P>) => {
                return (options?.contextValue || contextValue).payload;
            }, [contextValue.payload]);

            const getUpperAPI = useCallback(<N1 extends keyof A, >(
                _name: N1,
                options?: GetUpperAPIOptions<A, N1, O>
            ) => {
                return _getUpperApiDesc(contextValue, _name, options)?.apiNList;
            }, []);

            const getUpperBoundaryPayload = useCallback(<N1 extends keyof A, >(
                _name: N1,
                options?: GetUpperAPIOptions<A, N1, O>
            ) => {
                const parent = _getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
                if (!parent) return;
                return parent.bridge;
            }, []);

            return {
                getAPI,
                getBoundaryPayload,
                getUpperAPI,
                getUpperBoundaryPayload
            }
        },
        useUpperAPI: <N extends keyof A>(name: N, hookOptions?: GetUpperAPIOptions<A, N, O>, deps?: DependencyList) => {
            const {
                onInit
            } = hookOptions || {};

            const contextValue = useFinalContextValue(hookOptions);

            const _apiNList = useMemo(() => {
                return _getUpperApiDesc(contextValue, name, hookOptions)?.apiNList;
            }, deps || []);
            if (!_apiNList) return;

            useInitEffect(onInit, name, _apiNList, contextValue);

            return _apiNList;
        },
        useUpperBoundaryPayload: (hookOptions?: UpperOptions<A, O, P>, deps?: DependencyList) => {
            const {shouldForwardYield} = hookOptions || {};
            const contextValue = useFinalContextValue(hookOptions);

            return useMemo(() => {
                const parent = _getUpperContextValue(contextValue, shouldForwardYield);
                return parent?.payload;
            }, deps || [])
        }
    };
}

function useUniqueElementRef<T>(entity: RefObject<T>[] | RefObject<T>){
    const elRef = useRef<T>(null);

    useEffect(() => {

        if(Array.isArray(entity)) {
            entity.push(elRef);
        }

        return () => {
            removeArrayElement(entity, elRef)
        }
    },[entity]);

    return Array.isArray(entity) ? elRef : entity

}

const removeArrayElement = <T,>(entity: T[] | T, element: any)  => {
    if(Array.isArray(entity)) {
        const deleteIndex = entity.findIndex(r => r === element);
        if(deleteIndex > -1) {
            entity.splice(deleteIndex, 1);
        }
    }
};

function tryInvoke(mayFn: any): boolean{
    if(typeof mayFn === 'function') {
        mayFn()
        return true;
    }
    return false;
}

function useHookId(){
    return useMemo(() => {
        return  Symbol('hookId') //genUid();
    }, []);
}



function appendToMappedValue<K extends object, E>(map: WeakMap<K, E[]>, key: K, element: E){
    let arr = map.get(key);
    if (typeof arr === 'undefined') {
       arr = [element];
        map.set(key, arr);
    } else {
        arr.push(element);
    }

    return () => {
        removeArrayElement(arr, element);
        if(arr?.length === 0) {
            map.delete(key);
        }
    }
}


const usedIdList: number[] = [];
const genUid = () => {
    const lastId = usedIdList.slice(-1)[0];

    const newId = (lastId + 1) || 0;
    usedIdList.push(newId);

    return newId
}