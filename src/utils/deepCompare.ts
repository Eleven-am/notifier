export function deepCompare (firstObject: any, secondObject: any): boolean {
    if (firstObject === secondObject) {
        return true;
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
