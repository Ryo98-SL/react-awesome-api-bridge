import {describe, expect, test} from '@jest/globals';
import {appendToMappedValue, removeArrayElement, tryInvoke} from "../src/utils";

test('appendToMappedValue', () => {
    const map = new Map<any, any[]>();
    let clearFn: any;

    appendToMappedValue(map, 'first', 'pop')
    expect(map.get('first')!.length).toBe(1);
    clearFn = appendToMappedValue(map, 'first', 'pop')
    expect(map.get('first')!.length).toBe(2);
    clearFn();
    expect(map.get('first')!.length).toBe(1);

    clearFn = appendToMappedValue(map, 'second', 'pop')
    expect(map.get('second')!.length).toBe(1);
    clearFn();
    expect(map.get('second')).toBeUndefined();

})


test('tryInvoke', () => {
    expect(tryInvoke(() => 1)).toBe(true);
    expect(tryInvoke(function(){})).toBe(true);
    expect(tryInvoke(false)).toBe(false);
    expect(tryInvoke(true)).toBe(false);
    expect(tryInvoke(1)).toBe(false);
    expect(tryInvoke(0)).toBe(false);
    expect(tryInvoke(undefined)).toBe(false);
    expect(tryInvoke(null)).toBe(false);
})


test('removeArrayElement', () => {
    const obj = {pop: 1};
    const arr = [1, 'asd', obj];
    removeArrayElement(arr, obj);
    expect(arr).toStrictEqual([1, 'asd']);
    removeArrayElement(arr, obj);
    expect(arr).toStrictEqual([1, 'asd']);
    removeArrayElement(arr, 1);
    expect(arr).toStrictEqual([ 'asd']);
    removeArrayElement(arr, 'asd');
    expect(arr).toStrictEqual([]);
})
