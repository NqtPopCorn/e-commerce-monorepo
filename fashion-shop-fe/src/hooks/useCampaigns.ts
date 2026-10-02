import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsService } from "@/services/campaigns.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  CampaignQuery,
  CreateCampaignDto,
  UpdateCampaignDto,
} from "@/types/campaign";

export const useGetCampaigns = (query?: CampaignQuery) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-campaigns", query],
    queryFn: () => campaignsService.getAll(query),
    enabled: !!token,
  });
};

export const useGetCampaign = (id: string | number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-campaign", String(id)],
    queryFn: () => campaignsService.getOne(id),
    enabled: !!token && !!id && id !== "create",
  });
};

export const useGetCampaignStats = (id: string | number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-campaign-stats", String(id)],
    queryFn: () => campaignsService.getStats(id),
    enabled: !!token && !!id && id !== "create",
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignDto) => campaignsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateCampaignDto;
    }) => campaignsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-campaign", String(data.id)],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-campaign-stats", String(data.id)],
      });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => campaignsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
  });
};
