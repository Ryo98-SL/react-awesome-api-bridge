import {RefObject, useEffect, useRef} from "react";
import {removeArrayElement} from "./removeArrayElement";

export function useUniqueElementRef<T>(entity: RefObject<T>[] | RefObject<T>) {
    const elRef = useRef<T>(null);

    useEffect(() => {

        if (Array.isArray(entity)) {
            entity.push(elRef);
        }

        return () => {
            removeArrayElement(entity, elRef)
        }
    }, [entity]);

    return Array.isArray(entity) ? elRef : entity

}