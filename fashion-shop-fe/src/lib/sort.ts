export type SortOrder = "asc" | "desc";

export type CustomGetters<T> = Record<string, (item: T) => any>;

/**
 * Safely extracts a value from an object using dot notation (e.g. "user.firstName")
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path
    .split(".")
    .reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

/**
 * In-memory high-speed sorting function supporting numbers, dates,
 * Vietnamese localized strings, nested keys, and custom getters.
 */
export function sortData<T>(
  data: T[],
  sortBy: string | null,
  sortOrder: SortOrder = "asc",
  customGetters?: CustomGetters<T>,
): T[] {
  if (!sortBy || !Array.isArray(data) || data.length <= 1) {
    return data;
  }

  const getter =
    customGetters?.[sortBy] || ((item: T) => getNestedValue(item, sortBy));

  const collator = new Intl.Collator("vi", {
    numeric: true,
    sensitivity: "base",
  });

  return [...data].sort((a, b) => {
    const rawA = getter(a);
    const rawB = getter(b);

    const isNilA = rawA === null || rawA === undefined || rawA === "";
    const isNilB = rawB === null || rawB === undefined || rawB === "";

    if (isNilA && isNilB) return 0;
    if (isNilA) return 1; // Put empty/null values at the end
    if (isNilB) return -1;

    let comparison = 0;

    // Both are numbers or numeric strings
    if (typeof rawA === "number" && typeof rawB === "number") {
      comparison = rawA - rawB;
    } else if (rawA instanceof Date && rawB instanceof Date) {
      comparison = rawA.getTime() - rawB.getTime();
    } else if (
      typeof rawA === "string" &&
      typeof rawB === "string" &&
      (rawA.includes("-") || rawA.includes("/")) &&
      !isNaN(Date.parse(rawA)) &&
      !isNaN(Date.parse(rawB))
    ) {
      comparison = new Date(rawA).getTime() - new Date(rawB).getTime();
    } else if (typeof rawA === "boolean" && typeof rawB === "boolean") {
      comparison = rawA === rawB ? 0 : rawA ? -1 : 1;
    } else {
      comparison = collator.compare(String(rawA), String(rawB));
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
}
