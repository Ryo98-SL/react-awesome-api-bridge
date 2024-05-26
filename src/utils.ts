export const removeArrayElement = <T, >(entity: T[] | T, element: any) => {
    if (Array.isArray(entity)) {
        const deleteIndex = entity.findIndex(r => r === element);
        if (deleteIndex > -1) {
            entity.splice(deleteIndex, 1);
        }
    }
};

export function tryInvoke(mayFn: any): boolean {
    if (typeof mayFn === 'function') {
        mayFn()
        return true;
    }
    return false;
}

const prefixes: string[] = [];
let lastOccupiedNumber = 0;
export const genHookId = () => {
    if (lastOccupiedNumber < Number.MAX_SAFE_INTEGER) {
        lastOccupiedNumber++
    } else {
        prefixes.push(String.fromCharCode(prefixes.length))
        lastOccupiedNumber = 0;
    }
    return [...prefixes, lastOccupiedNumber].join('');
}

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
