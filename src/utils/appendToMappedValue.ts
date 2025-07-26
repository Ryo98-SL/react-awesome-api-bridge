import {removeArrayElement} from "./removeArrayElement";

export function appendToMappedValue<K extends object, E>(map: WeakMap<K, E[]>, key: K, element: E) {
    let arr = map.get(key);
    if (typeof arr === 'undefined') {
        arr = [element];
        map.set(key, arr);
    } else {
        arr.push(element);
    }

    return () => {
        removeArrayElement(arr, element);
        if (arr?.length === 0) {
            map.delete(key);
        }
    }
}