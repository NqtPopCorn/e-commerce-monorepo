"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Tag } from "lucide-react";
import { ChatRecommendedProduct } from "@/types/chatbot";
import { formatCurrency } from "@/lib/format";

interface ChatProductCardProps {
  product: ChatRecommendedProduct;
}

export const ChatProductCard: React.FC<ChatProductCardProps> = ({ product }) => {
  const productUrl = `/products/${product.id}`;

  return (
    <div className="shrink-0 w-[170px] bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-[3/4] w-full bg-gray-50 overflow-hidden">
        <Image
          src={
            product.imageUrl ||
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80"
          }
          alt={product.name}
          fill
          unoptimized
          sizes="170px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
            -{product.discountPercent}%
          </span>
        )}

        {product.category && (
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
            <Tag className="w-2.5 h-2.5" />
            {product.category}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          {product.brand && (
            <p className="text-[10px] text-gray-400 font-medium line-clamp-1">
              {product.brand}
            </p>
          )}
          <h4
            className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </h4>
        </div>

        <div className="pt-1 border-t border-gray-50">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-rose-600">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <Link
            href={productUrl}
            className="mt-2 w-full inline-flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-medium text-[11px] py-1 px-2 rounded-lg transition-colors"
          >
            <span>Xem ngay</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
