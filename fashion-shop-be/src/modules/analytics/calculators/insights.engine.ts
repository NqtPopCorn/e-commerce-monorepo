export interface BusinessInsightItem {
  id: string;
  type: "REVENUE_DROP" | "STOCKOUT_ALERT" | "HIGH_DISCOUNT" | "BUDGET_EXHAUSTION" | "POSITIVE_GROWTH";
  title: string;
  message: string;
  severity: "alert" | "warning" | "info" | "positive";
  ctaText?: string;
  ctaLink?: string;
  evidence: string[];
}

export class InsightsEngine {
  static evaluateInsights(params: {
    salesDeltaPercent: number;
    currentSales: number;
    previousSales: number;
    grossSales: number;
    discountCost: number;
    productPerformance: {
      id: number;
      name: string;
      revenue: number;
      trendPercent: number;
    }[];
    previousProductMap: Map<number, { revenue: number }>;
    criticalSkus: {
      id: number;
      sku: string;
      productName: string;
      stock: number;
      unitsSoldInPeriod: number;
    }[];
    campaigns: {
      id: number;
      name: string;
      budgetLimit: number | null;
      spentAmount: number;
    }[];
  }): BusinessInsightItem[] {
    const insights: BusinessInsightItem[] = [];

    // Rule 1: Cảnh báo sụt giảm doanh thu >= 15%
    if (params.salesDeltaPercent <= -15 && params.previousSales > 0) {
      // Tìm top sản phẩm giảm doanh thu nhiều nhất về giá trị tuyệt đối
      const dropContributors: { name: string; loss: number; percent: number }[] = [];

      params.productPerformance.forEach((prod) => {
        const prev = params.previousProductMap.get(prod.id);
        if (prev && prev.revenue > prod.revenue) {
          const loss = prev.revenue - prod.revenue;
          dropContributors.push({
            name: prod.name,
            loss,
            percent: prod.trendPercent,
          });
        }
      });

      dropContributors.sort((a, b) => b.loss - a.loss);
      const topDrops = dropContributors.slice(0, 2);

      const evidence = [
        `Doanh thu kỳ này đạt ${params.currentSales.toLocaleString("vi-VN")} đ so với ${params.previousSales.toLocaleString("vi-VN")} đ kỳ trước.`,
      ];
      topDrops.forEach((d) => {
        evidence.push(
          `• Sản phẩm "${d.name}": giảm ${Math.abs(d.percent)}% (giảm ${d.loss.toLocaleString("vi-VN")} đ).`,
        );
      });

      insights.push({
        id: "insight-revenue-drop",
        type: "REVENUE_DROP",
        title: `Doanh thu sụt giảm ${Math.abs(params.salesDeltaPercent)}% so với kỳ trước`,
        message: "Xu hướng bán hàng suy giảm rõ rệt. Cần kiểm tra lại tồn kho các sản phẩm chủ lực hoặc tối ưu chiến dịch tiếp thị.",
        severity: "alert",
        ctaText: "Kiểm tra sản phẩm",
        ctaLink: "/admin/products",
        evidence,
      });
    } else if (params.salesDeltaPercent >= 15 && params.currentSales > 0) {
      // Trường hợp tích cực: Tăng trưởng mạnh
      insights.push({
        id: "insight-revenue-growth",
        type: "POSITIVE_GROWTH",
        title: `Doanh thu tăng trưởng mạnh mẽ +${params.salesDeltaPercent}%`,
        message: "Hiệu suất bán hàng vượt trội so với kỳ trước. Duy trì lượng hàng tồn kho cho các sản phẩm chủ lực.",
        severity: "positive",
        ctaText: "Xem chi tiết",
        ctaLink: "/admin/analytics",
        evidence: [
          `Doanh thu tăng thêm ${(params.currentSales - params.previousSales).toLocaleString("vi-VN")} đ so với chu kỳ trước.`,
        ],
      });
    }

    // Rule 2: Cảnh báo SKU bán chạy bị hết hàng (Stockout Velocity)
    const hotOutOfStock = params.criticalSkus.filter(
      (s) => s.stock === 0 && s.unitsSoldInPeriod >= 2,
    );
    if (hotOutOfStock.length > 0) {
      const evidence = hotOutOfStock.slice(0, 3).map(
        (s) => `• SKU ${s.sku} (${s.productName}): đã bán ${s.unitsSoldInPeriod} sp nhưng hiện tồn kho bằng 0.`,
      );

      insights.push({
        id: "insight-stockout-alert",
        type: "STOCKOUT_ALERT",
        title: `${hotOutOfStock.length} biến thể bán chạy đã hết hàng`,
        message: "Tình trạng thiếu hụt hàng hóa đang gây thất thoát doanh thu tiềm năng. Cần bổ sung phiếu nhập kho ngay.",
        severity: "alert",
        ctaText: "Tạo phiếu nhập hàng",
        ctaLink: "/admin/purchase",
        evidence,
      });
    }

    // Rule 3: Tỷ lệ chiết khấu cao bất thường (> 25% doanh thu gộp)
    if (params.grossSales > 0 && params.discountCost > 0) {
      const discountRatio = (params.discountCost / params.grossSales) * 100;
      if (discountRatio >= 25) {
        insights.push({
          id: "insight-high-discount",
          type: "HIGH_DISCOUNT",
          title: `Tỷ lệ chiết khấu cao (${discountRatio.toFixed(1)}% doanh thu gộp)`,
          message: "Chi phí khuyến mãi đang chiếm tỷ trọng lớn trong tổng giá trị hàng bán. Cần rà soát các voucher xếp chồng để tránh thâm hụt biên lợi nhuận.",
          severity: "warning",
          ctaText: "Rà soát khuyến mãi",
          ctaLink: "/admin/promotions",
          evidence: [
            `Tổng chiết khấu: ${params.discountCost.toLocaleString("vi-VN")} đ trên ${params.grossSales.toLocaleString("vi-VN")} đ doanh thu niêm yết.`,
          ],
        });
      }
    }

    // Rule 4: Chiến dịch sắp cạn ngân sách (>= 85% budgetLimit)
    params.campaigns.forEach((camp) => {
      if (camp.budgetLimit && Number(camp.budgetLimit) > 0) {
        const spent = Number(camp.spentAmount);
        const limit = Number(camp.budgetLimit);
        const percent = (spent / limit) * 100;

        if (percent >= 85) {
          insights.push({
            id: `insight-budget-camp-${camp.id}`,
            type: "BUDGET_EXHAUSTION",
            title: `Chiến dịch "${camp.name}" đã dùng ${percent.toFixed(0)}% ngân sách`,
            message: `Chiến dịch đã giải ngân ${spent.toLocaleString("vi-VN")} đ trên hạn mức ${limit.toLocaleString("vi-VN")} đ.`,
            severity: "warning",
            ctaText: "Quản lý chiến dịch",
            ctaLink: `/admin/promotions`,
            evidence: [
              `Ngân sách còn lại: ${(limit - spent).toLocaleString("vi-VN")} đ. Khuyến mãi sẽ tự động tạm dừng khi chạm trần.`,
            ],
          });
        }
      }
    });

    return insights;
  }
}
