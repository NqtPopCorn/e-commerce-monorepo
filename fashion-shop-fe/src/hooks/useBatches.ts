import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { batchesService } from "@/services/batches.service";
import { CreateBatchDto } from "@/types/batch";

export const useGetBatches = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-batches"],
    queryFn: batchesService.getAll,
    enabled: !!token,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchDto) => batchesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      // Invalidate stock to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
      // Invalidate books to update product list
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    },
  });
};
