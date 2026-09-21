import api from '@/api';
import useUserStore from '@/state/user';
import { COLORS } from '@/styles/colors';
import {
  SHOPPING_FREQUENCY_DAYS,
  ShoppingFrequency,
  ShoppingItemStatus,
  TBoughtShoppingItem,
  TCreateShoppingItem,
  TShoppingItem,
  TUpdateShoppingItem
} from '@/types/shopping';
import { getError } from '@/utils/error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

/** Вычислить статус товара */
export function getShoppingStatus(item: TShoppingItem): ShoppingItemStatus {
  if (item.bought) return ShoppingItemStatus.bought;
  if (item.buyByDate && new Date(item.buyByDate) < new Date()) {
    return ShoppingItemStatus.overdue;
  }
  return ShoppingItemStatus.pending;
}

export const SHOPPING_STATUS_LABEL: Record<ShoppingItemStatus, string> = {
  [ShoppingItemStatus.pending]: 'Нужно купить',
  [ShoppingItemStatus.bought]: 'Куплено',
  [ShoppingItemStatus.overdue]: 'Просрочено',
};

export const SHOPPING_STATUS_COLOR: Record<ShoppingItemStatus, string> = {
  [ShoppingItemStatus.pending]: COLORS.skyDark,
  [ShoppingItemStatus.bought]: COLORS.green,
  [ShoppingItemStatus.overdue]: COLORS.red,
};

export type ShoppingSortKey = 'date' | 'name' | 'status' | 'category';

export function useShoppingItems() {
  const [sortKey, setSortKey] = useState<ShoppingSortKey>('date');
  const [showBought, setShowBought] = useState(false);

  const { user } = useUserStore();

  const queryClient = useQueryClient();

  const familyUuid = useMemo(() => user?.family_id ?? "", [user])

  const { data, isPending } = useQuery({
    queryKey: ['getShoppings'],
    queryFn: () => api.get('/shopping'),
    enabled: !!familyUuid,
  });

  const createMutation = useMutation({
    mutationFn: (data: TCreateShoppingItem) => {
      return api.post('/shopping/create', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getShoppings'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: TUpdateShoppingItem) => {
      const { id, ...body } = data
      return api.put(`/shopping/${id}`, body);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getShoppings'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const putBoughtMutation = useMutation({
    mutationFn: (data: TBoughtShoppingItem) => {
      const { id, ...body } = data
      return api.put(`/shopping/${id}/bought`, body);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getShoppings'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/shopping/${id}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getShoppings'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const loading = isPending || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || putBoughtMutation.isPending

  const add = (data: TCreateShoppingItem) => {
    createMutation.mutate(data)
  };

  const update = (data: TUpdateShoppingItem) => {
    updateMutation.mutate(data)
  };

  const remove = (id: string) => {
    deleteMutation.mutate(id)
  };

  const shoppings = useMemo<TShoppingItem[]>(() => data?.data ?? [], [data]);

  const toggleBought = async (id: string, bought: boolean) => {
    putBoughtMutation.mutate({ id, bought })

    // Если повторяющийся товар помечен куплен — автоматически пересоздаём его
    const item = shoppings.find((i) => i.id === id);

    if (bought && item && item.frequency !== ShoppingFrequency.once) {
      const days = SHOPPING_FREQUENCY_DAYS[item.frequency];
      if (days) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        add(
          {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            buyByDate: nextDate.toISOString(),
            frequency: item.frequency,
          }
        );
      }
    }
  };

  // Фильтрация и сортировка
  const processedItems = shoppings
    .filter((i) => showBought || !i.bought)
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'status') {
        const order = [
          ShoppingItemStatus.overdue,
          ShoppingItemStatus.pending,
          ShoppingItemStatus.bought,
        ];
        return (
          order.indexOf(getShoppingStatus(a)) -
          order.indexOf(getShoppingStatus(b))
        );
      }
      if (sortKey === 'category') {
        return (a.category ?? '').localeCompare(b.category ?? '');
      }
      // по дате закупки
      const da = a.buyByDate ? new Date(a.buyByDate).getTime() : Infinity;
      const db = b.buyByDate ? new Date(b.buyByDate).getTime() : Infinity;
      return da - db;
    });

  const pendingCount = shoppings.filter((i) => !i.bought).length;
  const boughtCount = shoppings.filter((i) => i.bought).length;
  const overdueCount = shoppings.filter(
    (i) => !i.bought && i.buyByDate && new Date(i.buyByDate) < new Date(),
  ).length;

  return {
    items: processedItems,
    loading,
    familyUuid,
    sortKey,
    setSortKey,
    showBought,
    setShowBought,
    pendingCount,
    boughtCount,
    overdueCount,
    add,
    update,
    toggleBought,
    remove,
  };
}
