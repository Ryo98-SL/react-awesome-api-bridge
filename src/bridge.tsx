import React, {
    createContext,
    createRef,
    DependencyList,
    forwardRef,
    PropsWithChildren,
    RefObject,
    useCallback,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef
} from "react";
import {
    APIParams,
    Bridge,
    BridgeAPIOptions,
    HookOptions,
    OnInit,
    RegisterHookOptions,
    RootBoundaryAPI,
    RootBoundaryProps,
    RootContext
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
    const _getApi = <N extends keyof A>(name: N, source: Bridge<A, O>) => {
        if(!source[name]) {
            source[name] = {
                options: bridgeOptions?.[name],
                api: createRef<A[N]>()
            }
        }


        const _proxy = new Proxy<Partial<A[N]>>({}, {
            get(target, p: string | symbol, receiver: any): any {
                return source[name]!.api!.current?.[p];
            },
            set() {
                console.error("subsequent assignment is not allowed");
                return false;
            }
        });

        return {_proxy, ref: source[name]!.api!};
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
                    return _getApi(name, bridge)._proxy;
                },
                parent,
                payload: props.payload
            }
        },[props.payload]);

        const contextValue = useMemo(() => {
            const final = props.contextValue || {
                bridge,
                parent,
            };
            final.key = props.key;

            return final
        }, [props.contextValue, props.key]);

        return <BridgeContext.Provider value={contextValue}>{props.children}</BridgeContext.Provider>
    });
    Boundary.displayName = 'Boundary';
    function tryToInvoke<N extends keyof A>(onInit: OnInit<Partial<A[N]>> | undefined, api?: Partial<A[N]>) {
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

    const rootContextValue: RootContext<A, O> = {
        bridge: {},
        parent: null,
        key: 'root'
    }

    const useInnerContext = (context?: RootContext<A, O>) => {
        const upperContext = useContext(BridgeContext);
        const contextValue =  context || upperContext;
        if(!contextValue) {
            return rootContextValue;
        }
        return contextValue;
    }

    const useAPI = <N extends keyof A, >(name: N, hookOptions?: HookOptions<A, N, O>) => {
        const {onInit, context} = hookOptions || {};
        const contextValue = useInnerContext(context);
        return useMemo(() => {
            const _api = _getApi(name, contextValue!.bridge)._proxy;
            tryToInvoke(onInit, _api);
            return _api;
        }, []);
    };


    const useRegister = <N extends keyof A, T extends A[N]>(name: N, api: T, deps?: DependencyList, hookOptions?: RegisterHookOptions<A, N, O>) => {
        const {context} = hookOptions || {};
        const contextValue = useInnerContext(context);

        const {ref} = _getApi(name, contextValue!.bridge);
        const hasInitialized = useRef(false);

        useImperativeHandle(ref, () => {
            if (!hasInitialized.current) {
                initCbMap.get(ref)?.forEach(cb => cb(api));
                initCbMap.delete(ref);
                hasInitialized.current = true;
            }


            return api;
        }, deps);

        const getAPI = useCallback(<N1 extends Exclude<keyof A, N>, >(_name: N1) => {
            return _getApi(_name, contextValue.bridge)._proxy;
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
        useRegister,
        useAPI,
        useAPIRecursively: <N extends keyof A>(name: N, hookOptions?: HookOptions<A, N, O>) => {
            const {context, onInit} = hookOptions || {};

            const contextValue = useInnerContext(context);

            const visitedAPIsSet = useRef(new Set<any>());

            return useCallback(() => {
                let parent = contextValue;

                while (parent && !_getApi(name, parent.bridge) && parent.parent) {
                    parent = parent.parent;
                }

                const _api = parent ? _getApi(name, parent.bridge)._proxy : undefined;
                if (!visitedAPIsSet.current.has(_api)) {
                    tryToInvoke(onInit, _api);
                    visitedAPIsSet.current.add(_api);
                }

                return _api;
            }, []);
        }
    };
}
