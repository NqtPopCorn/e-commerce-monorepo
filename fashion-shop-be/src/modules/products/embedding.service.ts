import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ProductEmbeddingInput {
  name: string;
  category?: { name: string; parent?: { name: string } | null } | null;
  brand?: { name: string } | null;
  targetGender?: string | null;
  material?: string | null;
  season?: string | null;
  careInstructions?: string | null;
  pattern?: string | null;
  fit?: string | null;
  occasion?: string | null;
  description?: string | null;
  variants?: Array<{ color?: string | null; size?: string | null }>;
}

const GENDER_LABEL_MAP: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  UNISEX: "Unisex (Cả nam và nữ)",
};

export function buildProductEmbeddingText(
  product: ProductEmbeddingInput,
): string {
  const parts: string[] = [];

  parts.push(`Tên sản phẩm: ${product.name}`);

  if (product.category) {
    const catName = product.category.parent
      ? `${product.category.parent.name} > ${product.category.name}`
      : product.category.name;
    parts.push(`Danh mục: ${catName}`);
  }

  if (product.brand?.name) {
    parts.push(`Thương hiệu: ${product.brand.name}`);
  }

  if (product.targetGender) {
    parts.push(
      `Đối tượng: ${GENDER_LABEL_MAP[product.targetGender] || product.targetGender}`,
    );
  }

  if (product.fit) {
    parts.push(`Phom dáng: ${product.fit}`);
  }

  if (product.pattern) {
    parts.push(`Họa tiết: ${product.pattern}`);
  }

  if (product.occasion) {
    parts.push(`Dịp mặc: ${product.occasion}`);
  }

  if (product.material) {
    parts.push(`Chất liệu: ${product.material}`);
  }

  if (product.season) {
    parts.push(`Mùa thích hợp: ${product.season}`);
  }

  if (product.variants && product.variants.length > 0) {
    const colors = Array.from(
      new Set(product.variants.map((v) => v.color).filter(Boolean)),
    );
    if (colors.length > 0) {
      parts.push(`Màu sắc: ${colors.join(", ")}`);
    }
  }

  if (product.description) {
    parts.push(`Mô tả: ${product.description}`);
  }

  return parts.join("\n");
}

export function buildProductSearchText(product: ProductEmbeddingInput): string {
  const parts: string[] = [product.name];

  if (product.category) {
    if (product.category.parent?.name) {
      parts.push(product.category.parent.name);
    }
    parts.push(product.category.name);
  }

  if (product.brand?.name) {
    parts.push(product.brand.name);
  }

  if (product.targetGender) {
    parts.push(
      GENDER_LABEL_MAP[product.targetGender] || product.targetGender,
    );
  }

  if (product.fit) parts.push(product.fit);
  if (product.pattern) parts.push(product.pattern);
  if (product.occasion) parts.push(product.occasion);
  if (product.material) parts.push(product.material);
  if (product.season) parts.push(product.season);

  if (product.variants && product.variants.length > 0) {
    const colors = Array.from(
      new Set(product.variants.map((v) => v.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(product.variants.map((v) => v.size).filter(Boolean)),
    );
    if (colors.length > 0) parts.push(colors.join(" "));
    if (sizes.length > 0) parts.push(sizes.join(" "));
  }

  if (product.description) {
    parts.push(product.description);
  }

  return parts.join(" ");
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ollamaBaseUrl: string;
  private readonly embeddingModel: string;
  private readonly embeddingDim: number;
  private readonly minSimilarity: number;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl =
      this.configService.get<string>("OLLAMA_BASE_URL") ||
      "http://localhost:11434";
    this.embeddingModel =
      this.configService.get<string>("OLLAMA_EMBEDDING_MODEL") || "bge-m3";

    const rawDim = Number(
      this.configService.get<string>("OLLAMA_EMBEDDING_DIM"),
    );
    this.embeddingDim = Number.isFinite(rawDim) && rawDim > 0 ? rawDim : 1024;

    const rawMinSim = this.configService.get<string>(
      "SEMANTIC_MIN_SIMILARITY",
    );
    const parsedMinSim =
      rawMinSim !== undefined && rawMinSim !== "" ? Number(rawMinSim) : NaN;
    this.minSimilarity =
      Number.isFinite(parsedMinSim) && parsedMinSim >= 0 && parsedMinSim <= 1
        ? parsedMinSim
        : 0.35;
  }

  getEmbeddingModel(): string {
    return this.embeddingModel;
  }

  getEmbeddingDim(): number {
    return this.embeddingDim;
  }

  getMinSimilarity(): number {
    return this.minSimilarity;
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    const url = `${this.ollamaBaseUrl.replace(/\/+$/, "")}/api/embeddings`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: trimmed,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        this.logger.warn(
          `Ollama embeddings error: HTTP ${response.status} from ${url}`,
        );
        return null;
      }

      const data = (await response.json()) as { embedding?: number[] };
      if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
        this.logger.warn(
          `Ollama returned invalid embedding format for model ${this.embeddingModel}`,
        );
        return null;
      }

      return data.embedding;
    } catch (err: any) {
      this.logger.warn(
        `Failed to generate embedding from Ollama (${url}): ${err?.message || err}`,
      );
      return null;
    }
  }
}
