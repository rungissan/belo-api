
const typeCache: { [label: string]: boolean } = {};


/**
 * This function coerces a string into a string literal type.
 * Using tagged union types in TypeScript 2.0, this enables
 * powerful typechecking of our reducers.
 * Since every action label passes through this function it
 * is a good place to ensure all of our action labels are unique.
 */
export function type<T>(label: T | ''): T {
  if (typeCache[label as string]) {
    throw new Error(`Action type "${label}" is not unqiue"`);
  }

  typeCache[label as string] = true;

  return label as T;
}

/**
 * Returns true if the given value is type of Object
 */
export function isObject(val: any) {
  if (val === null) { return false; }

  return ( (typeof val === 'function') || (typeof val === 'object') );
}

/**
 * Capitalizes the first character in given string
 */
export function capitalize(s: string) {
  if (!s || typeof s !== 'string') { return s; }
  return s && s[0].toUpperCase() + s.slice(1);
}

/**
 * Uncapitalizes the first character in given string
 */
export function uncapitalize(s: string) {
  if (!s || typeof s !== 'string') { return s; }
  return s && s[0].toLowerCase() + s.slice(1);
}

/**
 * Flattens multi dimensional object into one level deep
 *
 */
export function flattenObject(ob: any, preservePath: boolean = false): any {
  const toReturn = {};

  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) { continue; }

    if ((typeof ob[i]) === 'object') {
      const flatObject = flattenObject(ob[i], preservePath);
      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) { continue; }

        const path = preservePath ? (i + '.' + x) : x;

        toReturn[path] = flatObject[x];
      }
    } else { toReturn[i] = ob[i]; }
  }

  return toReturn;
}

/**
 * Returns formated date based on given culture
 */
export function localeDateString(dateString: string, culture: string = 'en-EN'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(culture);
}
