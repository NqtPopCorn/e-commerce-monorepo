export interface ProductVariantLike {
  id?: number;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  stock: number;
}

export interface VariantQueryInput {
  variantId?: string | null;
  color?: string | null;
  size?: string | null;
}

function normalizeText(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function isInStock(variant: ProductVariantLike): boolean {
  return Number(variant.stock ?? 0) > 0;
}

function pickBestCandidate<T extends ProductVariantLike>(
  candidates: T[],
): T | null {
  if (candidates.length === 0) return null;
  return candidates.find(isInStock) ?? candidates[0];
}

export function resolveInitialVariant<T extends ProductVariantLike>(
  variants: T[] | undefined | null,
  query: VariantQueryInput,
): T | null {
  if (!variants || variants.length === 0) return null;

  const rawId = query.variantId?.trim();
  if (rawId) {
    const parsedId = Number(rawId);
    if (Number.isInteger(parsedId) && parsedId > 0) {
      const exactById = variants.find((v) => v.id === parsedId);
      if (exactById) return exactById;
    }
  }

  const targetColor = normalizeText(query.color);
  const targetSize = normalizeText(query.size);

  if (targetColor && targetSize) {
    const bothMatch = pickBestCandidate(
      variants.filter(
        (v) =>
          normalizeText(v.color) === targetColor &&
          normalizeText(v.size) === targetSize,
      ),
    );
    if (bothMatch) return bothMatch;
  }

  if (targetColor) {
    const colorMatch = pickBestCandidate(
      variants.filter((v) => normalizeText(v.color) === targetColor),
    );
    if (colorMatch) return colorMatch;
  }

  if (targetSize) {
    const sizeMatch = pickBestCandidate(
      variants.filter((v) => normalizeText(v.size) === targetSize),
    );
    if (sizeMatch) return sizeMatch;
  }

  return pickBestCandidate(variants);
}

export function resolveVariantForColorChange<T extends ProductVariantLike>(
  variants: T[] | undefined | null,
  nextColor: string,
  currentSize?: string | null,
): T | null {
  if (!variants || variants.length === 0) return null;

  const targetColor = normalizeText(nextColor);
  const colorVariants = variants.filter(
    (v) => normalizeText(v.color) === targetColor,
  );
  if (colorVariants.length === 0) return null;

  const targetSize = normalizeText(currentSize);
  if (targetSize) {
    const exactSizeMatches = colorVariants.filter(
      (v) => normalizeText(v.size) === targetSize,
    );
    const sameSize = pickBestCandidate(exactSizeMatches);
    if (sameSize) return sameSize;
  }

  return pickBestCandidate(colorVariants);
}

export function resolveVariantImageIndex<T extends ProductVariantLike>(
  allImages: string[],
  variant: T | null | undefined,
  allVariants?: T[] | null,
): number {
  if (allImages.length === 0 || !variant) return 0;

  if (variant.imageUrl) {
    const exactIdx = allImages.indexOf(variant.imageUrl);
    if (exactIdx !== -1) return exactIdx;
  }

  const targetColor = normalizeText(variant.color);
  if (targetColor && allVariants && allVariants.length > 0) {
    const siblingWithImage = allVariants.find(
      (v) =>
        normalizeText(v.color) === targetColor &&
        Boolean(v.imageUrl) &&
        allImages.includes(v.imageUrl as string),
    );
    if (siblingWithImage?.imageUrl) {
      const siblingIdx = allImages.indexOf(siblingWithImage.imageUrl);
      if (siblingIdx !== -1) return siblingIdx;
    }
  }

  return 0;
}

export function buildProductVariantUrl(
  productId: number | string,
  opts?: {
    variantId?: number | null;
    color?: string | null;
    size?: string | null;
  },
): string {
  const basePath = `/products/${productId}`;
  if (!opts) return basePath;

  if (
    opts.variantId !== undefined &&
    opts.variantId !== null &&
    Number.isInteger(opts.variantId) &&
    opts.variantId > 0
  ) {
    return `${basePath}?variantId=${opts.variantId}`;
  }

  const params = new URLSearchParams();
  if (opts.color?.trim()) {
    params.set("color", opts.color.trim());
  }
  if (opts.size?.trim()) {
    params.set("size", opts.size.trim());
  }

  const queryStr = params.toString();
  return queryStr ? `${basePath}?${queryStr}` : basePath;
}

