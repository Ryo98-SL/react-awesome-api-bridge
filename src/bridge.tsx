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
    OnInit,
    OnMultiInit,
    ResolveAPI,
    ResolveInit,
    UpperOptions
} from "./types";
import {appendToMappedValue, genHookId, removeArrayElement, tryInvoke} from "./utils";

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
    const cacheInitCbMap = new WeakMap<ApiNList<A, O, keyof A>, {
        onInit: Function;
        hookId: HookId;
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

    const initializedOnInitMap = new Map<RefObject<A[keyof A]>, HookId[]>();

    function mountHookInitEffect<N extends keyof A, ANL extends ResolveAPI<A, O, N>>
    (name: N, onInit: ResolveInit<A, O, N> | undefined, apiNList: ANL, hookId: any) {
        if(!onInit) return;
        const isMulti = getIsMulti(name) ?? false;
        const involvedApiList: RefObject<A[N]>[] = [];

        let deferFn: (() => void) | undefined;
        if (apiNList && !isMulti) {
            const _assertedApi = apiNList as RefObject< A[N]>;
            //Currently, no api exist, no need to call onInit
            if(!_assertedApi.current) return;
            const _assertedOnInit = onInit as OnInit<A, N>;

            deferFn = () => {
                return _assertedOnInit(_assertedApi)
            }

            involvedApiList.push(_assertedApi)
        } else if(apiNList && isMulti){
            const _assertedApiList = apiNList as RefObject<A[N]>[];
            //Currently, no api exist, no need to call onInit
            if(!_assertedApiList.length) return;
            const _assertedOnInit = onInit as OnMultiInit<A, N>;

            deferFn = () => {
                return _assertedOnInit(undefined, _assertedApiList);
            }

            involvedApiList.push(..._assertedApiList);
        } else {
            throw new Error('This might the internal Error of react-api-bridge');
        }


        let clearFns: any[] = [];

        if(involvedApiList.some((apiRef) => !initializedOnInitMap.get(apiRef)?.includes(hookId) )) {
            clearFns.push(
                deferFn?.(),
                ...involvedApiList.map((apiRef) => {
                    // marked as  initialized, prevent duplicate invocation
                    return appendToMappedValue(initializedOnInitMap, apiRef , hookId);
                })
            )
        }

        return () => {
            clearFns.forEach(tryInvoke);
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
            // cache onInit associated with hookId, then it will be invoked subsequently.
            const removeCache = appendToMappedValue(cacheInitCbMap, apiNList, {onInit, hookId});
            const clearInitEffect = mountHookInitEffect(name, onInit, apiNList, hookId);

            return () => {
                removeCache();
                clearInitEffect?.()
            }
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
                initializedOnInitMap.forEach((arr, key) => {
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
        initializedCallbacksMap: initializedOnInitMap,
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

            //init effect ---- start
            useImperativeHandle(apiRef, () => {
                return init();
            }, deps);
            useEffect(() => {
                let clearFns: any[] = [];
                const callbacks = cacheInitCbMap.get(apiNList);
                callbacks?.filter((initInfo) => {
                    return !initializedOnInitMap.get(apiRef)?.includes(initInfo.hookId)
                })
                    .forEach(initInfo => {
                        appendToMappedValue(initializedOnInitMap, apiRef, initInfo.hookId);

                        const onInit = initInfo.onInit;
                        if (isMulti) {
                            const _assertedOnInit = onInit as OnMultiInit<A, N>;
                            clearFns.push(_assertedOnInit(apiRef, apiNList as RefObject<A[N]>[]))
                        } else {
                            const _assertedOnInit = onInit as OnInit<A, N>;
                            clearFns.push(_assertedOnInit(apiRef))
                        }
                    });

                return () => {
                    clearFns.forEach(tryInvoke);
                    initializedOnInitMap.delete(apiRef);
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

function useHookId(): HookId{
    return useMemo(() => {
        return  process.env.NODE_ENV === 'development' ? genHookId() : Symbol('hookId')
    }, []);
}



type HookId = string | symbol;
