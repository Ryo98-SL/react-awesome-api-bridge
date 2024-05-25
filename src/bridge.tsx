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
    AllAPI,
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
    OnInit,
    OnMultiInit,
    ResolveAPI,
    ResolveInit,
    UpperOptions
} from "./types";

type PayloadParameter<T> =   undefined extends T ? [payload?: T] : [payload: T];
const createBridge = <
    A extends APIParams,
    P extends any  = any
>(...args: PayloadParameter<P>) => {
    const payload = args[0] as P;

    const output = genOutput<A, P>(payload);
    const currying = <O extends BridgeAPIOptions<A>>(options?: O) => {
        return genOutput<A, P, O>(payload,options);
    };

    return Object.assign(currying, output);
};

export default createBridge;

type ApiNList <A extends APIParams, O extends BridgeAPIOptions<A>, N extends keyof A> = ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>>;

function genOutput<A extends APIParams,P = any, const O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>>(payload: P, bridgeOptions?: O) {
    const defaultContextValue: BoundaryContextValue<A,P,O> = {
        bridge: {},
        parent: undefined,
        payload
    };

    const BridgeContext = createContext(defaultContextValue);

    // Is used to cache the onInit callback of useAPI and useUpperAPI.
    const cacheInitCbMap = new WeakMap<any, {
        onInit: Function;
        hookId: any;
    }[]>();

    function getIsMulti<N extends keyof A>(name: N) {
        return bridgeOptions?.[name]?.isMulti
    }

    const _getApiDesc = <N extends keyof A>(name: N, source: Bridge<A, O>) => {
        let isInitial = false;
        if(!source[name]) {
            isInitial = true;
            const isMulti = getIsMulti(name);
            const apiNList = ( isMulti ? [] as RefObject<A[N]>[]
                : createRef<A[N]>() ) as ApiNList<A, O, N>;

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
        const _payload =  props.contextValue?.payload ??  props.payload  as P;
        useImperativeHandle(ref, () => {
            return {
                getAPI: (name) => {
                    return _getApiDesc(name, bridge).apiNList;
                },
                parent,
                payload: _payload
            }
        },[_payload]);

        const contextValue = useMemo(() => {
            const final: BoundaryContextValue<A,P,O> = {
                ...(props.contextValue || {
                    bridge,
                    parent,
                }),
                payload: _payload
            };

            return final
        }, [props.contextValue, _payload]);

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

        let deferFn: (() => void) | undefined;
        if (apiNList && !isMulti) {
            const _assertedApi = apiNList as RefObject< A[N]>;
            //Currently, no api exist, no need to call onInit
            if(!_assertedApi.current) return;
            const _assertedOnInit = onInit as OnInit<A, N>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(_assertedApi);
            }

            involvedApiList.push(_assertedApi)
        } else if(apiNList && isMulti){
            const _assertedApiList = apiNList as RefObject<A[N]>[];
            //Currently, no api exist, no need to call onInit
            if(!_assertedApiList.length) return;
            const _assertedOnInit = onInit as OnMultiInit<A, N>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(undefined, _assertedApiList);
            }

            involvedApiList.push(..._assertedApiList);
        } else {
            throw new Error('This might the internal Error of react-api-bridge');
        }


        if(involvedApiList.some((apiRef) => !initializedCallbacksMap.get(apiRef)?.includes(hookId) )) {
            deferFn?.();
            involvedApiList.forEach((apiRef) => {
                // marked as  initialized, prevent duplicate invocation
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
            // cache onInit associated with hookId, then it will be invoked subsequently.
            return appendToMappedValue(cacheInitCbMap, apiNList, {onInit, hookId})
        }, []);

        // update onInit callback
        useEffect(() => {
            if (!onInit) return;
            const cacheCbs = cacheInitCbMap.get(apiNList);
            cacheCbs?.forEach((couple) => {
                if (couple.hookId === hookId) {
                    couple.onInit = onInit;
                }
            });
        }, [onInit]);

        // remove callback when unmount
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
            if(!shouldForwardYield) break;

            const apiNames =  Object.keys(parent.bridge) as (keyof A)[];

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


    function _getUpperApiDesc< N1 extends keyof A>(contextValue: BoundaryContextValue<A, P, O>,
                                                   _name: N1,
                                                   options?: GetUpperAPIOptions<A, N1, O, P>,) {
        const parent = _getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
        if (!parent) return;
        return _getApiDesc(_name, parent.bridge);
    }

    return {
        Boundary,
        initCbMap: cacheInitCbMap,
        initializedCallbacksMap,
        getAPI<N extends keyof A, >(name: N, contextValue: BoundaryContextValue<A, P, O> = defaultContextValue) {
            return _getApiDesc(name, contextValue.bridge).apiNList;
        },
        useAPI: <N extends keyof A, >(name: N, hookOptions?: GetAPIOptions<A, N, O>): ApiNList<A, O, N> => {
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
        useContextValue: (...args: PayloadParameter<P>): BoundaryContextValue<A, P, O> => {
            const payload = args[0] as P;
            const parent = useContext(BridgeContext);
            return useMemo(() => {
                return {
                    bridge: {},
                    parent,
                    payload
                }
            }, []);
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
                                return () => _assertedOnInit(apiRef, apiNList as RefObject<A[N]>[]);
                            } else {
                                const _assertedOnInit = onInit as OnInit<A, N>;

                                return () => _assertedOnInit(apiRef);
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
                options?: GetUpperAPIOptions<A, N1, O, P>
            ) => {
                return _getUpperApiDesc(contextValue, _name, options)?.apiNList;
            }, []);

            const getUpperBoundaryPayload = useCallback((
                options?: UpperOptions<A, O, P>
            ) => {
                const parent = _getUpperContextValue(options?.contextValue || contextValue, options?.shouldForwardYield);
                if (!parent) return;
                return parent.payload;
            }, []);

            return {
                getAPI,
                getBoundaryPayload,
                getUpperAPI,
                getUpperBoundaryPayload
            }
        },
        useUpperAPI: <N extends keyof A>(name: N, hookOptions?: GetUpperAPIOptions<A, N, O, P>): ApiNList<A, O, N> | undefined  => {
            const {
                onInit
            } = hookOptions || {};

            const contextValue = useFinalContextValue(hookOptions);

            const _apiNList = useMemo(() => {
                return _getUpperApiDesc(contextValue, name, hookOptions)?.apiNList;
            },  []);
            if (!_apiNList) return;

            useInitEffect(onInit, name, _apiNList, contextValue);

            return _apiNList;
        },
        useUpperBoundaryPayload: (hookOptions?: UpperOptions<A, O, P>) => {
            const {shouldForwardYield} = hookOptions || {};
            const contextValue = useFinalContextValue(hookOptions);

            const boundaryContextValue = useMemo(() => {
                return _getUpperContextValue(contextValue, shouldForwardYield);
            },  []);

            return boundaryContextValue?.payload
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
