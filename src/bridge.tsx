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
    useRef
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
    RootContext, ResolveAPI, ConditionByIsMulti
} from "./types";

const createBridge = <
    A extends APIParams,
>() => {
    const output = genOutput<A>()
    const currying = <O extends BridgeAPIOptions<A>>(options?: O) => {
        return genOutput<A, O>(options)
    };

    return Object.assign(currying, output);
}

export default createBridge;



function genOutput<A extends APIParams,const O extends BridgeAPIOptions<A> = BridgeAPIOptions<A>>(bridgeOptions?: O) {
    const BridgeContext = createContext<RootContext<A,O>>(null);

    const initCbMap = new WeakMap<any, OnInit<any>[]>();

    function getIsMulti<N extends keyof A>(name: N) {
        return bridgeOptions?.[name]?.isMulti
    }

    const _getApiDesc = <N extends keyof A>(name: N, source: Bridge<A, O>, silent = false) => {
        let isInitial = false;
        const isMulti = getIsMulti(name);
        if(!source[name] && !silent) {
            isInitial = true
            const apiInfo = ( isMulti ? [] as RefObject<A[N]>[] : createRef<A[N]>() ) as ConditionByIsMulti<O, N, RefObject<A[N]>[], RefObject<A[N]>>;

            source[name] = {
                options: bridgeOptions?.[name],
                api: apiInfo
            }
        }

        // @ts-ignore
        const _proxy = new Proxy<ResolveAPI<A, O, N>>( source[name]!.api! , {
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

        return {_proxy, ref: source[name]!.api!, isInitial};
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
            const final: RootContext<A,O> = props.contextValue || {
                bridge,
                parent,
                payload: props.payload
            };

            return final
        }, [props.contextValue, props.payload]);

        return <BridgeContext.Provider value={contextValue}>{props.children}</BridgeContext.Provider>
    });
    Boundary.displayName = 'Boundary';


    const rootContextValue: RootContext<A, O> = {
        bridge: {},
        parent: null,
        payload: null
    }

    const useInnerContext = (context?: RootContext<A, O>) => {
        const upperContext = useContext(BridgeContext);
        const contextValue =  context || upperContext;
        if(!contextValue) {
            return rootContextValue;
        }
        return contextValue;
    }

    function tryToInvoke<N extends keyof A, PAPI extends ResolveAPI<A, O, N>>(onInit: OnInit<PAPI> | undefined, api?: PAPI) {
        if (onInit && api) {
            if (api) {
                onInit(api);
            } else {
                const arr = initCbMap.get(api);
                if (typeof arr === 'undefined') {
                    initCbMap.set(api, [onInit]);
                } else {
                    arr.push(onInit);
                }
            }
        }
    }

    const useAPI = <N extends keyof A, >(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
        const {onInit, context} = hookOptions || {};
        const contextValue = useInnerContext(context);
        return useMemo(() => {
            const _api = _getApiDesc(name, contextValue!.bridge)._proxy;
            tryToInvoke(onInit, _api);
            return _api;
        }, []);
    };


    const useRegister = <N extends keyof A, T extends A[N]>(name: N, api: T, deps?: DependencyList, hookOptions?: BaseHookOptions<A, O>) => {
        const {context} = hookOptions || {};

        const isMulti = getIsMulti(name);
        const contextValue = useInnerContext(context);
        const hookId = useHookId();
        const {ref} = useMemo(() => _getApiDesc(name, contextValue!.bridge),[name, contextValue]);

        const hasInitialized = useRef(false);
        const {ref: elRef} = useUniqueElementRef(ref);

        useImperativeHandle(elRef, () => {
            if (!hasInitialized.current) {
                hasInitialized.current = true;
                initCbMap.get(ref)?.forEach(cb => cb(api));
                initCbMap.delete(ref);
            }

            return api;
        }, deps);

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
        useContextValue: (): RootContext<A, O> => {
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
            const {context} = hookOptions || {};
            const contextValue = useInnerContext(context);

            const getAPI = useCallback(<N1 extends keyof A, >(_name: N1) => {
                return _getApiDesc(_name, contextValue.bridge)._proxy;
            }, [contextValue.bridge]);

            return {
                getAPI,
            }
        },
        useBoundaryPayload: (hookOptions?: BaseHookOptions<A,O>) => {
            const {context} = hookOptions || {};

            const contextValue = useInnerContext(context);
            return contextValue.payload;
        },
        useRegister,
        useAPI,
        useAPIRecursively: <N extends keyof A>(name: N, hookOptions?: GetAPIHookOptions<A, N, O>) => {
            const {context, onInit} = hookOptions || {};

            const contextValue = useInnerContext(context);

            const visitedAPISet = useRef(new Set<any>());

            return useCallback(() => {
                let parent = contextValue;

                while (parent && !_getApiDesc(name, parent.bridge, true).isInitial && parent.parent) {
                    parent = parent.parent;
                }

                const _api = parent ? _getApiDesc(name, parent.bridge)._proxy : undefined;
                if (!visitedAPISet.current.has(_api)) {
                    tryToInvoke(onInit, _api);
                    visitedAPISet.current.add(_api);
                }

                return _api;
            }, []);
        }
    };
}

const APIListSet = new Set<any[]>();

function useHookId(){
    return useMemo(() => {
        return Date.now();
    },[])
}

function useUniqueElementRef<T>(entity: RefObject<T>[] | RefObject<T>){
    const elRef = useRef<T>(null);
    const _proxy = proxyRef(elRef);


    useEffect(() => {
        if(Array.isArray(entity)) {
            entity.push(_proxy);
        }

        return () => {
            if(Array.isArray(entity)) {
                const deleteIndex = entity.findIndex(r => r === _proxy);
                entity.splice(deleteIndex, 1);
            }
        }
    },[entity]);


    return {
        _proxy,
        ref: Array.isArray(entity) ? elRef : entity
    }
}

function proxyRef <T extends RefObject<any>>(ref: T): T{
    return new Proxy(ref,{
        get(target: T, p: string | symbol, receiver: any): any {
            return target.current[p];
        },

    })
}