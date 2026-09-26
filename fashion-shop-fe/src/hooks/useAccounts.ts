import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { accountsService } from "@/services/accounts.service";

export const useGetAccounts = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-accounts"],
    queryFn: accountsService.getAll,
    enabled: !!token,
  });
};

export const useUpdateAccountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      accountsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
};
