export interface SparklinePoint {
  date: string;
  value: number;
}

export interface KpiMetric {
  value: number;
  previousValue: number;
  deltaPercent: number; // Tỷ lệ tăng giảm %
  isPositive: boolean;
  sparkline: SparklinePoint[];
}

export interface SalesTimelinePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  units: number;
  prevRevenue?: number;
  prevOrders?: number;
  prevUnits?: number;
}

export class SalesCalculator {
  /**
   * Tính tỷ lệ tăng trưởng phần trăm an toàn, tránh chia cho 0
   */
  static calculateDelta(current: number, previous: number): number {
    if (previous === 0) {
      if (current > 0) return 100;
      if (current < 0) return -100;
      return 0;
    }
    const delta = ((current - previous) / previous) * 100;
    return Number(delta.toFixed(1));
  }

  /**
   * Tính các chỉ số KPI: Net Sales, Orders, Units Sold, AOV
   */
  static computeKpiMetrics(params: {
    currentSales: number;
    previousSales: number;
    currentOrders: number;
    previousOrders: number;
    currentUnits: number;
    previousUnits: number;
    currentTimeline: { date: string; revenue: number; orders: number; units: number }[];
  }): {
    netSales: KpiMetric;
    orders: KpiMetric;
    unitsSold: KpiMetric;
    aov: KpiMetric;
  } {
    const currentAov =
      params.currentOrders > 0
        ? Math.round(params.currentSales / params.currentOrders)
        : 0;
    const previousAov =
      params.previousOrders > 0
        ? Math.round(params.previousSales / params.previousOrders)
        : 0;

    const salesSparkline: SparklinePoint[] = params.currentTimeline.map((p) => ({
      date: p.date,
      value: p.revenue,
    }));

    const ordersSparkline: SparklinePoint[] = params.currentTimeline.map((p) => ({
      date: p.date,
      value: p.orders,
    }));

    const unitsSparkline: SparklinePoint[] = params.currentTimeline.map((p) => ({
      date: p.date,
      value: p.units,
    }));

    const aovSparkline: SparklinePoint[] = params.currentTimeline.map((p) => ({
      date: p.date,
      value: p.orders > 0 ? Math.round(p.revenue / p.orders) : 0,
    }));

    const salesDelta = this.calculateDelta(params.currentSales, params.previousSales);
    const ordersDelta = this.calculateDelta(params.currentOrders, params.previousOrders);
    const unitsDelta = this.calculateDelta(params.currentUnits, params.previousUnits);
    const aovDelta = this.calculateDelta(currentAov, previousAov);

    return {
      netSales: {
        value: params.currentSales,
        previousValue: params.previousSales,
        deltaPercent: salesDelta,
        isPositive: salesDelta >= 0,
        sparkline: salesSparkline,
      },
      orders: {
        value: params.currentOrders,
        previousValue: params.previousOrders,
        deltaPercent: ordersDelta,
        isPositive: ordersDelta >= 0,
        sparkline: ordersSparkline,
      },
      unitsSold: {
        value: params.currentUnits,
        previousValue: params.previousUnits,
        deltaPercent: unitsDelta,
        isPositive: unitsDelta >= 0,
        sparkline: unitsSparkline,
      },
      aov: {
        value: currentAov,
        previousValue: previousAov,
        deltaPercent: aovDelta,
        isPositive: aovDelta >= 0,
        sparkline: aovSparkline,
      },
    };
  }

  /**
   * Kết hợp timeline của chu kỳ hiện tại và chu kỳ trước để hiển thị biểu đồ so sánh
   */
  static mergeTimelines(
    currentPoints: { date: string; revenue: number; orders: number; units: number }[],
    prevPoints: { date: string; revenue: number; orders: number; units: number }[],
  ): SalesTimelinePoint[] {
    return currentPoints.map((point, index) => {
      const prevPoint = prevPoints[index];
      return {
        date: point.date,
        revenue: point.revenue,
        orders: point.orders,
        units: point.units,
        prevRevenue: prevPoint ? prevPoint.revenue : 0,
        prevOrders: prevPoint ? prevPoint.orders : 0,
        prevUnits: prevPoint ? prevPoint.units : 0,
      };
    });
  }
}
