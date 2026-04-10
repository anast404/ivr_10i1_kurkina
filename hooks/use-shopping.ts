import { useCallback, useEffect, useState } from 'react';
import {
  TShoppingItem,
  TCreateShoppingItem,
  ShoppingItemStatus,
  ShoppingFrequency,
  SHOPPING_FREQUENCY_DAYS,
} from '@/types/shopping';
import {
  getShoppingItems,
  addShoppingItem,
  updateShoppingItem,
  toggleShoppingItemBought,
  deleteShoppingItem,
} from '@/utils/shopping-store';
import { getDocument } from '@/utils/firebase-store';
import useUserStore from '@/state/user';

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
  [ShoppingItemStatus.bought]:  'Куплено',
  [ShoppingItemStatus.overdue]: 'Просрочено',
};

export const SHOPPING_STATUS_COLOR: Record<ShoppingItemStatus, string> = {
  [ShoppingItemStatus.pending]: '#4E8FAD',
  [ShoppingItemStatus.bought]:  '#4CAF50',
  [ShoppingItemStatus.overdue]: '#D95B5B',
};

export type ShoppingSortKey = 'date' | 'name' | 'status' | 'category';

export function useShoppingItems() {
  const { user } = useUserStore((s) => s);
  const [items, setItems]         = useState<TShoppingItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [familyUuid, setFamilyUuid] = useState<string | null>(null);
  const [sortKey, setSortKey]     = useState<ShoppingSortKey>('date');
  const [showBought, setShowBought] = useState(false);

  // Получаем familyUuid из профиля
  useEffect(() => {
    if (!user?.uid) return;
    getDocument('users', user.uid).then((data) => {
      if (data?.family_uuid) setFamilyUuid(data.family_uuid);
    });
  }, [user?.uid]);

  const load = useCallback(async () => {
    if (!familyUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getShoppingItems(familyUuid);
      setItems(data);
    } catch (e) {
      setError('Не удалось загрузить список покупок');
      console.log('error loading pills:', e);
    } finally {
      setLoading(false);
    }
  }, [familyUuid]);

  useEffect(() => { load(); }, [load]);

  const add = async (data: TCreateShoppingItem) => {
    if (!familyUuid || !user?.uid) return;
    await addShoppingItem(data, familyUuid, user.uid);
    await load();
  };

  const update = async (id: string, data: Partial<TShoppingItem>) => {
    await updateShoppingItem(id, data);
    await load();
  };

  const toggleBought = async (id: string, bought: boolean) => {
    await toggleShoppingItemBought(id, bought);

    // Если повторяющийся товар помечен куплен — автоматически пересоздаём его
    const item = items.find((i) => i.id === id);
    if (bought && item && item.frequency !== ShoppingFrequency.once) {
      const days = SHOPPING_FREQUENCY_DAYS[item.frequency];
      if (days) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        await addShoppingItem(
          {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            buyByDate: nextDate.toISOString(),
            frequency: item.frequency,
          },
          familyUuid!,
          user!.uid,
        );
      }
    }

    await load();
  };

  const remove = async (id: string) => {
    await deleteShoppingItem(id);
    await load();
  };

  // Фильтрация и сортировка
  const processedItems = items
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

  const pendingCount = items.filter((i) => !i.bought).length;
  const boughtCount  = items.filter((i) => i.bought).length;
  const overdueCount = items.filter(
    (i) => !i.bought && i.buyByDate && new Date(i.buyByDate) < new Date(),
  ).length;

  return {
    items: processedItems,
    loading,
    error,
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
    reload: load,
  };
}
