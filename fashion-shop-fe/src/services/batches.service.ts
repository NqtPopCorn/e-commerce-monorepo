import { api } from "@/lib/api";
import { Batch, CreateBatchDto } from "@/types/batch";

export const batchesService = {
  getAll: async (): Promise<Batch[]> => {
    const res = await api.get("/batches");
    return res.data;
  },

  create: async (data: CreateBatchDto): Promise<Batch> => {
    const res = await api.post("/batches", data);
    return res.data;
  },
};
