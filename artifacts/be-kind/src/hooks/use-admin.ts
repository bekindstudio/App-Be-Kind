import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

export function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: () => customFetch<{ isAdmin: boolean }>("/api/admin/check"),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => customFetch<{
      dishes: number; events: number; products: number; users: number;
      orders: number; shopOrders: number; reservations: number; eventRegistrations: number;
      pendingOrders: number; pendingShopOrders: number; todayReservations: number;
    }>("/api/admin/stats"),
    refetchInterval: 30000,
  });
}

export function useAdminDishes() {
  return useQuery({ queryKey: ["admin-dishes"], queryFn: () => customFetch<any[]>("/api/admin/dishes") });
}

export function useAdminMenuCategories() {
  return useQuery({ queryKey: ["admin-menu-categories"], queryFn: () => customFetch<any[]>("/api/admin/menu-categories") });
}

export function useAdminEvents() {
  return useQuery({ queryKey: ["admin-events"], queryFn: () => customFetch<any[]>("/api/admin/events") });
}

export function useAdminProducts() {
  return useQuery({ queryKey: ["admin-products"], queryFn: () => customFetch<any[]>("/api/admin/products") });
}

export function useAdminProductCategories() {
  return useQuery({ queryKey: ["admin-product-categories"], queryFn: () => customFetch<any[]>("/api/admin/product-categories") });
}

export function useAdminOrders() {
  return useQuery({ queryKey: ["admin-orders"], queryFn: () => customFetch<any[]>("/api/admin/orders") });
}

export function useAdminShopOrders() {
  return useQuery({ queryKey: ["admin-shop-orders"], queryFn: () => customFetch<any[]>("/api/admin/shop-orders") });
}

export function useAdminReservations() {
  return useQuery({ queryKey: ["admin-reservations"], queryFn: () => customFetch<any[]>("/api/admin/reservations") });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin-users"], queryFn: () => customFetch<any[]>("/api/admin/users") });
}

export function useSaveDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/dishes/${id}` : "/api/admin/dishes";
      return customFetch<any>(url, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dishes"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useDeleteDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/dishes/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dishes"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useSaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/events/${id}` : "/api/admin/events";
      return customFetch<any>(url, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/events/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/products/${id}` : "/api/admin/products";
      return customFetch<any>(url, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useSaveMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/menu-categories/${id}` : "/api/admin/menu-categories";
      return customFetch<any>(url, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-menu-categories"] }); },
  });
}

export function useDeleteMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/menu-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-menu-categories"] }); },
  });
}

export function useSaveProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      const url = id ? `/api/admin/product-categories/${id}` : "/api/admin/product-categories";
      return customFetch<any>(url, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-categories"] }); },
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => customFetch<any>(`/api/admin/product-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-categories"] }); },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      customFetch<any>(`/api/admin/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useUpdateShopOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, trackingNumber }: { id: number; status: string; trackingNumber?: string }) =>
      customFetch<any>(`/api/admin/shop-orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, trackingNumber }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-shop-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      customFetch<any>(`/api/admin/reservations/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reservations"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useToggleUserAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) =>
      customFetch<any>(`/api/admin/users/${id}/admin`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAdmin }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
}
