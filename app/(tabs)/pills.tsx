import { usePills, PILL_STATUS_LABEL, SortKey } from '@/hooks/use-pills';
import { PillStatus, TPill, TCreatePill } from '@/types/pill';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StyledText } from '@/components/atom/styled-text';
import { PillCard } from '@/components/organism/pill-card';
import { PillForm } from '@/components/organism/pill-form';

// ─── Настройки сортировки ────────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'expiresAt', label: 'По сроку' },
  { key: 'name', label: 'По названию' },
  { key: 'status', label: 'По статусу' },
];

// ─── Настройки фильтра ───────────────────────────────────────────────────────
const FILTER_OPTIONS: { key: PillStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: PillStatus.expired, label: '🔴 Просрочено' },
  { key: PillStatus.expiring_soon, label: '🟠 Истекает' },
  { key: PillStatus.ok, label: '🟢 В порядке' },
];

export default function PillsScreen() {
  const {
    pills,
    loading,
    error,
    familyUuid,
    sortKey,
    setSortKey,
    filterStatus,
    setFilterStatus,
    add,
    update,
    remove,
  } = usePills();

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<TPill | null>(null);

  // Открыть форму добавления
  const openAdd = () => {
    setEditTarget(null);
    setFormVisible(true);
  };

  // Открыть форму редактирования
  const openEdit = (pill: TPill) => {
    setEditTarget(pill);
    setFormVisible(true);
  };

  // Сохранить (добавить или обновить)
  const handleSave = async (data: TCreatePill) => {
    if (editTarget) {
      await update(editTarget.id, data);
    } else {
      await add(data);
    }
    setFormVisible(false);
  };

  // Подтверждение удаления
  const handleDelete = (pill: TPill) => {
    Alert.alert(
      'Удалить лекарство',
      `Удалить «${pill.name}» из аптечки?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => remove(pill.id) },
      ]
    );
  };

  // ─── Нет семьи ───────────────────────────────────────────────────────────
  if (!familyUuid) {
    return (
      <View style={styles.centered}>
        <StyledText style={styles.emptyText}>
          Создайте или присоединитесь к семье в разделе «Профиль», чтобы использовать аптечку.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ─── Шапка с кнопкой добавления ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <StyledText style={styles.screenTitle}>Аптечка</StyledText>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <StyledText style={styles.addBtnText}>＋ Добавить</StyledText>
        </Pressable>
      </View>

      {/* ─── Фильтр по статусу ───────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, filterStatus === opt.key && styles.chipActive]}
            onPress={() => setFilterStatus(opt.key)}
          >
            <StyledText
              style={[styles.chipText, filterStatus === opt.key && styles.chipTextActive]}
            >
              {opt.label}
            </StyledText>
          </Pressable>
        ))}
      </ScrollView>

      {/* ─── Сортировка ──────────────────────────────────────────────────── */}
      <View style={styles.sortBar}>
        <StyledText style={styles.sortLabel}>Сортировка: </StyledText>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
            onPress={() => setSortKey(opt.key)}
          >
            <StyledText
              style={[styles.sortChipText, sortKey === opt.key && styles.sortChipTextActive]}
            >
              {opt.label}
            </StyledText>
          </Pressable>
        ))}
      </View>

      {/* ─── Список лекарств ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <StyledText style={styles.errorText}>{error}</StyledText>
        </View>
      ) : pills.length === 0 ? (
        <View style={styles.centered}>
          <StyledText style={styles.emptyText}>
            {filterStatus !== 'all'
              ? 'Нет лекарств с таким статусом.'
              : 'Аптечка пуста. Добавьте первое лекарство!'}
          </StyledText>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {pills.map((pill) => (
            <PillCard
              key={pill.id}
              pill={pill}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      )}

      {/* ─── Форма добавления/редактирования ────────────────────────────── */}
      <PillForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

// ─── Стили ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 13,
    color: '#444',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 4,
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    color: '#888',
  },
  sortChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sortChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  sortChipText: {
    fontSize: 12,
    color: '#555',
  },
  sortChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
  },
});
