import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Types
export type SalesOrder = Tables<'sales_orders'> & {
  customer?: {
    id: string;
    code: string | null;
    name: string;
    phone: string | null;
  } | null;
  items?: SalesOrderItem[];
};

export type SalesOrderItem = Tables<'sales_order_items'> & {
  product?: {
    id: string;
    code: string;
    name: string;
    unit: string;
  } | null;
};

interface SalesOrderListResponse {
  success: boolean;
  data: SalesOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  errorMessage?: string;
}

interface SalesOrderGetResponse {
  success: boolean;
  data: SalesOrder;
  errorMessage?: string;
}

interface SalesOrderCreateResponse {
  success: boolean;
  data: SalesOrder;
  errorMessage?: string;
}

interface CreateSalesOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface CreateSalesOrderData {
  customer_id?: string | null;
  items: CreateSalesOrderItem[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number;
  other_fee?: number;
  paid_amount: number;
  note?: string;
  sale_date?: string;
}

// List sales orders with pagination
export function useSalesOrders(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['sales_orders', page, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sales-order', {
        body: {
          action: 'list',
          page,
          limit,
        },
      });

      if (error) throw new Error(error.message);
      
      const response = data as SalesOrderListResponse;
      if (!response.success) {
        throw new Error(response.errorMessage || 'Failed to fetch sales orders');
      }

      return response;
    },
  });
}

// Get single sales order with items
export function useSalesOrder(orderId: string) {
  return useQuery({
    queryKey: ['sales_order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sales-order', {
        body: {
          action: 'get',
          order_id: orderId,
        },
      });

      if (error) throw new Error(error.message);

      const response = data as SalesOrderGetResponse;
      if (!response.success) {
        throw new Error(response.errorMessage || 'Failed to fetch sales order');
      }

      return response.data;
    },
    enabled: !!orderId,
  });
}

// Create sales order
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateSalesOrderData) => {
      const { data, error } = await supabase.functions.invoke('sales-order', {
        body: {
          action: 'create',
          ...orderData,
        },
      });

      if (error) throw new Error(error.message);

      const response = data as SalesOrderCreateResponse;
      if (!response.success) {
        throw new Error(response.errorMessage || 'Failed to create sales order');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
