import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function buildProductEmbeddingText(product: {
  name: string;
  category?: { name: string; parent?: { name: string } | null } | null;
  brand?: { name: string } | null;
  targetGender?: string | null;
  material?: string | null;
  season?: string | null;
  careInstructions?: string | null;
  description?: string | null;
  variants?: Array<{ color?: string | null; size?: string | null }>;
}): string {
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
    const genderMap: Record<string, string> = {
      MALE: "Nam",
      FEMALE: "Nữ",
      UNISEX: "Unisex (Cả nam và nữ)",
    };
    parts.push(`Đối tượng: ${genderMap[product.targetGender] || product.targetGender}`);
  }

  if (product.material) {
    parts.push(`Chất liệu: ${product.material}`);
  }

  if (product.season) {
    parts.push(`Mùa thích hợp: ${product.season}`);
  }

  if (product.careInstructions) {
    parts.push(`Bảo quản: ${product.careInstructions}`);
  }

  if (product.description) {
    parts.push(`Mô tả: ${product.description}`);
  }

  if (product.variants && product.variants.length > 0) {
    const colors = Array.from(
      new Set(product.variants.map((v) => v.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(product.variants.map((v) => v.size).filter(Boolean)),
    );

    if (colors.length > 0) {
      parts.push(`Màu sắc: ${colors.join(", ")}`);
    }
    if (sizes.length > 0) {
      parts.push(`Size sẵn có: ${sizes.join(", ")}`);
    }
  }

  return parts.join("\n");
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ollamaBaseUrl: string;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl =
      this.configService.get<string>("OLLAMA_BASE_URL") ||
      "http://localhost:11434";
    this.embeddingModel =
      this.configService.get<string>("OLLAMA_EMBEDDING_MODEL") ||
      "nomic-embed-text";
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
        signal: AbortSignal.timeout(10000),
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
