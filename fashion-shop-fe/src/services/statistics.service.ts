import { api } from "@/lib/api";
import {
  OverviewStatistic,
  RevenueStatistic,
  StockStatistic,
} from "@/types/statistic";

export const statisticsService = {
  getOverview: async (): Promise<OverviewStatistic> => {
    const res = await api.get("/statistics/overview");
    return res.data;
  },

  getRevenue: async (): Promise<RevenueStatistic[]> => {
    const res = await api.get("/statistics/revenue");
    return res.data;
  },

  getStock: async (): Promise<StockStatistic[]> => {
    const res = await api.get("/statistics/stock");
    return res.data;
  },
};
