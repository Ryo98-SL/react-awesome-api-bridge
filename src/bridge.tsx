import React, {
    createContext,
    createRef,
    DependencyList,
    forwardRef,
    PropsWithChildren,
    RefObject,
    useCallback,
    useContext, useEffect, useId,
    useImperativeHandle,
    useMemo,
    useRef, useState
} from "react";
import {
    APIParams,
    Bridge,
    BridgeAPIOptions,
    GetAPIHookOptions,
    OnInit,
    BaseHookOptions,
    RootBoundaryAPI,
    RootBoundaryProps,
    RootContextValue, ResolveAPI, ConditionByIsMulti, MapMulti
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

    const initCbMap = new WeakMap<any, OnInit<any, boolean>[]>();

    function getIsMulti<N extends keyof A>(name: N) {
        return bridgeOptions?.[name]?.isMulti
    }

    const _getApiDesc = <N extends keyof A>(name: N, source: Bridge<A, O>, silent = false) => {
        let isInitial = false;
        if(!source[name] && !silent) {
            isInitial = true;
            const isMulti = getIsMulti(name);
            const apiInfo = ( isMulti ? [] as RefObject<A[N]>[] : createRef<A[N]>() ) as ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>>;

            // @ts-ignore
            const _proxy = new Proxy<ResolveAPI<A, O, N>>( apiInfo , {
                get(target, p, receiver: any) {
                    if(isMulti) {
                        // @ts-ignore
                        return source[name]!.api?.[p];
                    }else {
                        // @ts-ignore
                        return source[name]!.api!.current?.[p];
                    }
                },
            });

            source[name] = {
                options: bridgeOptions?.[name],
                api: apiInfo,
                _proxy
            }
        }



        return {_proxy: source[name]!._proxy, ref: source[name]!.api!, isInitial};
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

    function tryToInvoke<N extends keyof A, PAPI extends ResolveAPI<A, O, N>>(name: N, onInit: OnInit<Partial<A[N]>, MapMulti<O, N>> | undefined, api?: PAPI) {
        if(!onInit) return;

        const isMulti = getIsMulti(name) ?? false;
        if (api && !isMulti) {
            (onInit as OnInit<Partial<A[N]>, false>)(api as Partial<A[N]>);
        } else if(api && api.length && isMulti){
            (onInit as OnInit<Partial<A[N]>, true>)(undefined, api as Partial<A[N]>[]);
        }

        const arr = initCbMap.get(api);
        if (typeof arr === 'undefined') {
            initCbMap.set(api, [onInit]);
        } else {
            arr.push(onInit);
        }

        return () => {
            removeArrayElement(initCbMap.get(api), onInit);
        }
    }

    const useAPI = <N extends keyof A, >(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
        const {onInit, contextValue: _outerContextValue} = hookOptions || {};
        const contextValue = useFinalContextValue(_outerContextValue);
        const {_proxy, ref} = _getApiDesc(name, contextValue!.bridge);

        useEffect(() => {
            return tryToInvoke(name, onInit, _proxy)
        }, [name, contextValue]);
        return _proxy;
    };


    const useRegister = <N extends keyof A, T extends A[N]>(name: N, api: T, deps?: DependencyList, hookOptions?: BaseHookOptions<A, O>) => {
        const {contextValue: _outerContextValue} = hookOptions || {};

        const isMulti = getIsMulti(name);
        const contextValue = useFinalContextValue(_outerContextValue);
        const {ref, _proxy} = useMemo(() => _getApiDesc(name, contextValue!.bridge),[name, contextValue]);

        const {ref: elRef, _proxy: _elProxy} = useUniqueElementRef(ref);
        const hasInitialized = useRef(false);

        //init effect ---- start
        useImperativeHandle(elRef, () => {
            return api;
        }, deps);
        useEffect(() => {
            if (!hasInitialized.current) {
                const callbacks = initCbMap.get(_proxy);
                callbacks?.forEach(cb => {
                    if(isMulti) {
                        cb(api, _proxy as Partial<A[N]>[])
                    } else {
                        // @ts-ignore
                        cb(api);
                    }
                });

                hasInitialized.current = true;
            }
        }, deps);
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
        useAPIRecursively: <N extends keyof A>(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
            const {onInit, contextValue: _outerContextValue} = hookOptions || {};
            const contextValue = useFinalContextValue(_outerContextValue);

            const visitedAPISet = useRef(new Set<any>());

            return useCallback(() => {
                let parent = contextValue;

                while (parent && !_getApiDesc(name, parent.bridge, true).isInitial && parent.parent) {
                    parent = parent.parent;
                }

                const _api = parent ? _getApiDesc(name, parent.bridge)._proxy : undefined;
                if (!visitedAPISet.current.has(_api)) {
                    tryToInvoke(name, onInit, _api);
                    visitedAPISet.current.add(_api);
                }

                return _api;
            }, [contextValue, name]);
        }
    };
}

function useUniqueElementRef<T>(entity: RefObject<T>[] | RefObject<T>){
    const elRef = useRef<T>(null);
    const _proxyRef = useRef< RefObject<T> | null>(null);
    useEffect(() => {
        const _proxy = proxyRef(elRef);
        if(Array.isArray(entity)) {
            entity.push(_proxy);
        }

        return () => {
            removeArrayElement(entity, _proxy)
        }
    },[entity]);

    return {
        _proxy: _proxyRef.current,
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