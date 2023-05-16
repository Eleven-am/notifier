export function deepCompare (firstObject: any, secondObject: any): boolean {
    if (firstObject === secondObject) {
        return true;
    }

    if (firstObject instanceof Date && secondObject instanceof Date) {
        return firstObject.getTime() === secondObject.getTime();
    }

    if (Array.isArray(firstObject) && Array.isArray(secondObject)) {
        if (firstObject.length !== secondObject.length) {
            return false;
        }

        return firstObject.every((item, index) => deepCompare(item, secondObject[index]));
    }

    if (firstObject && secondObject && typeof firstObject === 'object' && typeof secondObject === 'object') {
        if (firstObject.constructor !== secondObject.constructor) {
            return false;
        }
        const properties = Object.keys(firstObject);

        if (properties.length !== Object.keys(secondObject).length) {
            return false;
        }

        return properties.every((prop) => deepCompare(firstObject[prop], secondObject[prop]));
    }


    return false;
}
