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