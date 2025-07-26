export const removeArrayElement = <T, >(entity: T[] | T, element: any) => {
    if (Array.isArray(entity)) {
        const deleteIndex = entity.findIndex(r => r === element);
        if (deleteIndex > -1) {
            entity.splice(deleteIndex, 1);
        }
    }
};