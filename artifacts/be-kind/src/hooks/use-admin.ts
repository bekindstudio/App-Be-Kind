import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

export function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: () => customFetch<{ isAdmin: boolean }>("/api/admin/check"),
  });
}

export function useAdminDishes() {
  return useQuery({
    queryKey: ["admin-dishes"],
    queryFn: () => customFetch<any[]>("/api/admin/dishes"),
  });
}

export function useAdminMenuCategories() {
  return useQuery({
    queryKey: ["admin-menu-categories"],
    queryFn: () => customFetch<any[]>("/api/admin/menu-categories"),
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ["admin-events"],
    queryFn: () => customFetch<any[]>("/api/admin/events"),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: () => customFetch<any[]>("/api/admin/products"),
  });
}

export function useAdminProductCategories() {
  return useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: () => customFetch<any[]>("/api/admin/product-categories"),
  });
}

export function useSaveDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/dishes/${id}` : "/api/admin/dishes";
      const method = id ? "PUT" : "POST";
      return customFetch<any>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dishes"] }); },
  });
}

export function useDeleteDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/dishes/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dishes"] }); },
  });
}

export function useSaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/events/${id}` : "/api/admin/events";
      const method = id ? "PUT" : "POST";
      return customFetch<any>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/events/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/products/${id}` : "/api/admin/products";
      const method = id ? "PUT" : "POST";
      return customFetch<any>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });
}
