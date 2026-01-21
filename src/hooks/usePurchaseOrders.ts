import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Types
export type PurchaseOrder = Tables<'purchase_orders'> & {
  supplier?: Tables<'suppliers'> | null;
  items_total?: number;
};

export type PurchaseOrderItem = Tables<'purchase_order_items'> & {
  product?: Tables<'products'> | null;
};

export type PurchaseOrderWithItems = PurchaseOrder & {
  items: PurchaseOrderItem[];
};

interface PurchaseOrderListResponse {
  success: boolean;
  data: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: string;
}

interface PurchaseOrderResponse {
  success: boolean;
  data: PurchaseOrderWithItems;
  error?: string;
}

interface CreatePurchaseOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface CreatePurchaseOrderData {
  supplier_id?: string | null;
  items: CreatePurchaseOrderItem[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number;
  other_fee?: number;
  note?: string;
  received_at?: string;
}

// Fetch purchase orders via edge function
export function usePurchaseOrders(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['purchase_orders', page, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<PurchaseOrderListResponse>(
        'purchase-order',
        {
          body: { action: 'list', page, limit },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch purchase orders');

      return data;
    },
  });
}

// Fetch single purchase order with items
export function usePurchaseOrderWithItems(id: string) {
  return useQuery({
    queryKey: ['purchase_order', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<PurchaseOrderResponse>(
        'purchase-order',
        {
          body: { action: 'get', order_id: id },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch purchase order');

      return data.data;
    },
    enabled: !!id,
  });
}

// Create purchase order (draft)
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreatePurchaseOrderData) => {
      const { data, error } = await supabase.functions.invoke<PurchaseOrderResponse>(
        'purchase-order',
        {
          body: {
            action: 'create',
            ...orderData,
          },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to create purchase order');

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
    },
  });
}

// Complete purchase order (update stock)
export function useCompletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke<{ success: boolean; message?: string; error?: string }>(
        'purchase-order',
        {
          body: {
            action: 'complete',
            order_id: orderId,
          },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to complete purchase order');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_order'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
