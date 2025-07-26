export function tryInvoke(mayFn: any): boolean {
    if (typeof mayFn === 'function') {
        mayFn()
        return true;
    }
    return false;
}