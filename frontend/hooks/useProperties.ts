import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyAPI, PropertyFilters } from "@/lib/property-api";

// Query Keys
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: number) => [...propertyKeys.details(), id] as const,
  managers: () => [...propertyKeys.all, "managers"] as const,
};

// Get all properties with filters
export function useProperties(filters?: PropertyFilters) {
  return useQuery({
    queryKey: propertyKeys.list(filters || {}),
    queryFn: () => propertyAPI.getAllProperties(filters),
  });
}

// Get single property by ID
export function useProperty(id: number) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyAPI.getPropertyById(id),
    enabled: !!id,
  });
}

// Get all managers
export function useManagers() {
  return useQuery({
    queryKey: propertyKeys.managers(),
    queryFn: () => propertyAPI.getManagers(),
  });
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      address: string;
      city_id: number;
      latitude?: number | null;
      longitude?: number | null;
      floors_from?: number | null;
      floors_to?: number | null;
      show_monthly_reports_to_tenants?: boolean;
      manager_ids?: number[];
    }) => propertyAPI.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

// Update property mutation
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        address?: string;
        city_id?: number;
        latitude?: number | null;
        longitude?: number | null;
        floors_from?: number | null;
        floors_to?: number | null;
        show_monthly_reports_to_tenants?: boolean;
        manager_ids?: number[];
      };
    }) => propertyAPI.updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
    },
  });
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => propertyAPI.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}
