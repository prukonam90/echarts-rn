type PlainObject = Record<string, unknown>;

export function deepMerge(base: PlainObject, override: PlainObject): PlainObject {
  const result: PlainObject = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    const bv = result[key];
    if (
      ov !== null &&
      ov !== undefined &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      bv !== null &&
      bv !== undefined &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      result[key] = deepMerge(bv as PlainObject, ov as PlainObject);
    } else {
      result[key] = ov;
    }
  }
  return result;
}
