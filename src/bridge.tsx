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
    BaseHookOptions,
    Bridge,
    BridgeAPIOptions,
    ConditionByIsMulti,
    GetAPIHookOptions,
    HookId,
    MapMulti,
    OnInit,
    ResolveAPI,
    RootBoundaryAPI,
    RootBoundaryProps,
    RootContextValue
} from "./types";

const createBridge = <
    A extends APIParams,
>() => {
    const output = genOutput<A>();
    const currying = <O extends BridgeAPIOptions<A>>(options?: O) => {
        return genOutput<A, O>(options);
    };

    return Object.assign(currying, output);
};

export default createBridge;



function genOutput<A extends APIParams,const O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>>(bridgeOptions?: O) {
    const BridgeContext = createContext<RootContextValue<A,O>>(null);

    const cacheInitCbMap = new Map<any, {
        onInit: OnInit<any, boolean>;
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
            const apiNList = ( isMulti ? [] as RefObject<A[N]>[] : createRef<A[N]>() ) as ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>>;

            // @ts-ignore
            const _proxy = new Proxy<ResolveAPI<A, O, N>>( apiNList , {
                get(target, p, receiver: any) {
                    if(isMulti) {
                        // @ts-ignore
                        return source[name]!.apiNList?.[p];
                    }else {
                        // @ts-ignore
                        return source[name]!.apiNList!.current?.[p];
                    }
                },
            });

            source[name] = {
                options: bridgeOptions?.[name],
                apiNList: apiNList,
                _proxy
            }
        }



        return {_proxy: source[name]!._proxy, ref: source[name]!.apiNList!, isInitial};
    }
    const Boundary = forwardRef<
        RootBoundaryAPI<A, O>,
        PropsWithChildren<RootBoundaryProps<A, O>>
    >((props, ref) => {
        const _ownBridge = useMemo(() => ({}), []);
        const bridge: Bridge<A, O> = props.contextValue?.bridge || _ownBridge;
        const paramParent = props.contextValue?.parent;
        const upperParent = useContext(BridgeContext);
        const parent = paramParent || upperParent;
        useImperativeHandle(ref, () => {
            return {
                bridge,
                getAPI: (name) => {
                    return _getApiDesc(name, bridge)._proxy;
                },
                parent,
                payload: props.payload
            }
        },[props.payload]);

        const contextValue = useMemo(() => {
            const final: RootContextValue<A,O> = props.contextValue || {
                bridge,
                parent,
                payload: props.payload
            };

            return final
        }, [props.contextValue, props.payload]);

        return <BridgeContext.Provider value={contextValue}>{props.children}</BridgeContext.Provider>
    });
    Boundary.displayName = 'Boundary';


    const rootContextValue: RootContextValue<A, O> = {
        bridge: {},
        parent: null,
        payload: null
    }

    const useFinalContextValue = (contextValue?: RootContextValue<A, O>) => {
        const upperContext = useContext(BridgeContext);
        const inheritContextValue =  contextValue || upperContext;
        if(!inheritContextValue) {
            return rootContextValue;
        }
        return inheritContextValue;
    }

    const initializedCallbacksMap = new Map<Partial<A[keyof A]>, HookId[]>();

    function mountHookInitEffect<N extends keyof A, ANL extends ResolveAPI<A, O, N>>(name: N, onInit: OnInit<Partial<A[N]>, MapMulti<O, N>> | undefined, _proxyApiNList: ANL, hookId: any) {
        if(!onInit) return;
        let clearEffectCallback: any;
        const isMulti = getIsMulti(name) ?? false;
        const involvedApiList: Partial<A[N]>[] = [];

        // cache callback for subsequent register _proxyApiNList

        let unHandle = false;
        let deferFn: (() => void) | undefined;
        if (_proxyApiNList && !isMulti) {
            const _assertedApi = _proxyApiNList as Partial<A[N]>;
            const _assertedOnInit = onInit as OnInit<Partial<A[N]>, false>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(_assertedApi);
            }

            involvedApiList.push(_assertedApi)
        } else if(_proxyApiNList && _proxyApiNList.length && isMulti){
            const _assertedApiList = _proxyApiNList as Partial<A[N]>[];
            const _assertedOnInit = onInit as OnInit<Partial<A[N]>, true>;

            deferFn = () => {
                clearEffectCallback = _assertedOnInit(undefined, _assertedApiList);
            }

            involvedApiList.push(..._assertedApiList);
        } else {
            unHandle = true
            console.log("=>(bridge.tsx:168) unhandle", );
        }

        if(!unHandle && involvedApiList.every((_proxyApi) => !initializedCallbacksMap.get(_proxyApi)?.includes(hookId) )) {
            deferFn?.();
            /**
             * record initialized callbacks' correspond hookId against the api which it receives, ensure the callback will
             * not call again during current lifecycle of the component which include "useAPI" hook.
             * the returned clear function need to be called when component destroy.
             */
            involvedApiList.forEach((_proxyApi) => {
                appendToMappedValue(initializedCallbacksMap, _proxyApi , hookId);
            });
        }

        return () => {
            tryInvoke(clearEffectCallback);
        }
    }

    const useAPI = <N extends keyof A, >(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
        const {onInit, contextValue: _outerContextValue} = hookOptions || {};
        const contextValue = useFinalContextValue(_outerContextValue);
        const {_proxy, ref} = _getApiDesc(name, contextValue!.bridge);
        const hookId = useHookId();

        useEffect(() => {
            if(!onInit) return;
            return mountHookInitEffect(name, onInit, _proxy, hookId);
        }, [name, onInit, contextValue]);

        useEffect(() => {
            if(!onInit) return;
            const removeCachedCallback = appendToMappedValue(cacheInitCbMap, _proxy, {onInit, hookId});

            return () => {
                removeCachedCallback();
            }
        }, []);

        // update onInit callback
        useEffect(() => {
            if(!onInit) return;
            const cacheCbs = cacheInitCbMap.get(_proxy);
            cacheCbs?.map((couple) => {
                if(couple.hookId === hookId) return {onInit, hookId};
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
        return _proxy;
    };


    const useRegister = <N extends keyof A, T extends A[N]>(name: N, api: T, deps?: DependencyList, hookOptions?: BaseHookOptions<A, O>) => {
        const {contextValue: _outerContextValue} = hookOptions || {};

        const isMulti = getIsMulti(name);
        const contextValue = useFinalContextValue(_outerContextValue);
        const {ref, _proxy} = useMemo(() => _getApiDesc(name, contextValue!.bridge),[name, contextValue]);

        const {ref: apiRef, _proxyRef: _proxyApiRef} = useUniqueElementRef(ref);
        const hasInitialized = useRef(false);

        //init effect ---- start
        useImperativeHandle(apiRef, () => {
            return api;
        }, deps);
        useEffect(() => {
            if (!hasInitialized.current) {
                const callbacks = cacheInitCbMap.get(_proxy);
                const deferFnList = callbacks?.filter((initInfo) => {
                    return !initializedCallbacksMap.get(_proxyApiRef.current!)?.includes(initInfo.hookId)
                })
                    .map( initInfo => {
                        appendToMappedValue(initializedCallbacksMap, _proxyApiRef.current!, initInfo.hookId);
                        if (isMulti) {
                            return () => initInfo.onInit(api, _proxy as Partial<A[N]>[]);
                        } else {
                            // @ts-ignore
                            return () => initInfo.onInit(api);
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
                initializedCallbacksMap.delete(_proxyApiRef.current!);
            }
        }, []);
        //init effect ---- end



        const getAPI = useCallback(<N1 extends Exclude<keyof A, N>, >(_name: N1) => {
            return _getApiDesc(_name, contextValue.bridge)._proxy;
        }, [contextValue.bridge]);

        return useMemo(() => {
            return {
                getAPI,
                bridges: contextValue!.bridge
            }
        }, [getAPI, contextValue]);
    };

    return {
        Boundary,
        useContextValue: (): RootContextValue<A, O> => {
            const parent = useContext(BridgeContext);
            return useMemo(() => {
                return {
                    bridge: {},
                    parent
                }
            }, []);
        },
        useBoundaryRef: () => {
            return useRef<RootBoundaryAPI<A, O>>(null);
        },
        useTools: (hookOptions?: BaseHookOptions<A, O>) => {
            const {contextValue: _outerContextValue} = hookOptions || {};
            const contextValue = useFinalContextValue(_outerContextValue);

            const getAPI = useCallback(<N1 extends keyof A, >(_name: N1) => {
                return _getApiDesc(_name, contextValue.bridge)._proxy;
            }, [contextValue.bridge]);

            const getBoundaryPayload = useCallback(<N1 extends keyof A, >(_name: N1) => {
                return contextValue.payload;
            }, [contextValue.payload]);

            return {
                getAPI,
                getBoundaryPayload
            }
        },
        useBoundaryPayload: (hookOptions?: BaseHookOptions<A,O>) => {
            const {contextValue: _outerContextValue} = hookOptions || {};
            const contextValue = useFinalContextValue(_outerContextValue);

            return contextValue.payload;
        },
        useRegister,
        useAPI,
        initCbMap: cacheInitCbMap,
        initializedCallbacksMap,
        // useAPIRecursively: <N extends keyof A>(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
        //     const {onInit, contextValue: _outerContextValue} = hookOptions || {};
        //     const contextValue = useFinalContextValue(_outerContextValue);
        //     const hookId = useHookId();
        //     const visitedAPISet = useRef(new Set<any>());
        //
        //     return useCallback(() => {
        //         let parent = contextValue;
        //
        //         while (parent && !_getApiDesc(name, parent.bridge, true).isInitial && parent.parent) {
        //             parent = parent.parent;
        //         }
        //
        //         const _api = parent ? _getApiDesc(name, parent.bridge)._proxy : undefined;
        //         if (!visitedAPISet.current.has(_api)) {
        //             mountHookInitEffect(name, onInit, _api, hookId);
        //             visitedAPISet.current.add(_api);
        //         }
        //
        //         return _api;
        //     }, [onInit, contextValue, name]);
        // }
    };
}

function useUniqueElementRef<T>(entity: RefObject<T>[] | RefObject<T>){
    const elRef = useRef<T>(null);
    const _proxyRef = useRef< T | null>(null);
    useEffect(() => {
        const _proxy = proxyRef(elRef);
        _proxyRef.current = _proxy as T;
        if(Array.isArray(entity)) {
            entity.push(_proxy);
        }

        return () => {
            removeArrayElement(entity, _proxy)
        }
    },[entity]);

    return {
        _proxyRef: _proxyRef,
        ref: Array.isArray(entity) ? elRef : entity
    }
}

const removeArrayElement = <T,>(entity: T[] | T, _proxyRef: any)  => {
    if(Array.isArray(entity)) {
        const deleteIndex = entity.findIndex(r => r === _proxyRef);
        if(deleteIndex > -1) {
            entity.splice(deleteIndex, 1);
        }
    }
};

function proxyRef <T extends RefObject<any>>(ref: T): T{
    return new Proxy(ref,{
        get(target: T, p: string | symbol, receiver: any): any {
            return target.current[p];
        },

    })
}
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



function appendToMappedValue<K, E>(map: Map<K, E[]>, key: K, element: E){
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