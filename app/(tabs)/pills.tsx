import { usePills, PILL_STATUS_LABEL, SortKey } from '@/hooks/use-pills';
import { PillStatus, TPill, TCreatePill } from '@/types/pill';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PillCard } from '@/components/organism/pill-card';
import { PillForm } from '@/components/organism/pill-form';

const C = {
  sky:       '#7AAFC9',
  skyDark:   '#4E8FAD',
  skyPale:   '#EBF4FF',
  cream:     '#FAF6EF',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  red:       '#D95B5B',
  redPale:   '#FDEAEA',
  orange:    '#E8973A',
  green:     '#5BA86A',
  bg:        '#F2F7FA',
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'expiresAt', label: 'По сроку' },
  { key: 'name',     label: 'По названию' },
  { key: 'status',   label: 'По статусу' },
];

const FILTER_OPTIONS: { key: PillStatus | 'all'; label: string; emoji: string }[] = [
  { key: 'all',                   label: 'Все',       emoji: '💊' },
  { key: PillStatus.expired,      label: 'Просрочено', emoji: '🔴' },
  { key: PillStatus.expiring_soon,label: 'Истекает',   emoji: '🟠' },
  { key: PillStatus.ok,           label: 'В порядке',  emoji: '🟢' },
];

export default function PillsScreen() {
  const {
    pills, loading, error, familyUuid,
    sortKey, setSortKey,
    filterStatus, setFilterStatus,
    add, update, remove,
  } = usePills();

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget]   = useState<TPill | null>(null);

  const openAdd  = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit = (pill: TPill) => { setEditTarget(pill); setFormVisible(true); };

  const handleSave = async (data: TCreatePill) => {
    if (editTarget) await update(editTarget.id, data);
    else await add(data);
    setFormVisible(false);
  };

  const handleDelete = (pill: TPill) => {
    Alert.alert('Удалить лекарство', `Удалить «${pill.name}» из аптечки?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => remove(pill.id) },
    ]);
  };

  if (!familyUuid) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🏠</Text>
        <Text style={styles.emptyTitle}>Нет семьи</Text>
        <Text style={styles.emptyText}>
          Создайте или присоединитесь к семье в разделе «Профиль»
        </Text>
      </View>
    );
  }

  // Статистика
  const expiredCount  = pills.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date()).length;
  const totalCount    = pills.length;

  return (
    <View style={styles.root}>

      {/* ── Шапка ── */}
      <View style={styles.header}>
        <View style={styles.headerBgCircle} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>💊 Аптечка</Text>
            <Text style={styles.headerSub}>
              {totalCount} лекарств{expiredCount > 0 ? ` · ${expiredCount} просрочено` : ''}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={openAdd}
          >
            <Text style={styles.addBtnText}>＋ Добавить</Text>
          </Pressable>
        </View>

        {/* Фильтры */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.filterChip, filterStatus === opt.key && styles.filterChipActive]}
              onPress={() => setFilterStatus(opt.key)}
            >
              <Text style={styles.filterEmoji}>{opt.emoji}</Text>
              <Text style={[styles.filterLabel, filterStatus === opt.key && styles.filterLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Сортировка ── */}
      <View style={styles.sortBar}>
        <Text style={styles.sortBarLabel}>Сортировка:</Text>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
            onPress={() => setSortKey(opt.key)}
          >
            <Text style={[styles.sortChipText, sortKey === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Список ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.sky} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : pills.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>💊</Text>
          <Text style={styles.emptyTitle}>
            {filterStatus !== 'all' ? 'Ничего не найдено' : 'Аптечка пуста'}
          </Text>
          <Text style={styles.emptyText}>
            {filterStatus !== 'all'
              ? 'Нет лекарств с таким статусом'
              : 'Добавьте первое лекарство'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {pills.map((pill) => (
            <PillCard key={pill.id} pill={pill} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </ScrollView>
      )}

      <PillForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Шапка
  header: {
    backgroundColor: C.skyDark,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgCircle: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50, right: -50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 2 },

  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  addBtnPressed: { backgroundColor: 'rgba(255,255,255,0.35)' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterEmoji: { fontSize: 12 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  filterLabelActive: { color: C.skyDark },

  // Сортировка
  sortBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sortBarLabel: { fontSize: 12, fontWeight: '700', color: C.stone },
  sortChip: {
    borderRadius: 8, borderWidth: 1.5, borderColor: '#E0E8E4',
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.white,
  },
  sortChipActive: { backgroundColor: C.skyPale, borderColor: C.sky },
  sortChipText: { fontSize: 12, fontWeight: '700', color: C.stone },
  sortChipTextActive: { color: C.skyDark },

  // Список
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },

  // Пустые состояния
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal, marginBottom: 6 },
  emptyText:  { fontSize: 14, color: C.stone, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  errorEmoji: { fontSize: 40, marginBottom: 10 },
  errorText:  { fontSize: 14, color: C.red, textAlign: 'center', fontWeight: '700' },
});