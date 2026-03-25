import { usePills, PILL_STATUS_LABEL, SortKey } from '@/hooks/use-pills';
import { PillStatus, TPill, TCreatePill } from '@/types/pill';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PillCard } from '@/components/organism/pill-card';
import { PillForm } from '@/components/organism/pill-form';

// ─── SVG иллюстрации ────────────────────────────────────────────────────────
import PillsHero  from '@/assets/images/pills-hero.svg';
import PillsEmpty from '@/assets/images/pills-empty.svg';

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

const FILTER_OPTIONS: { key: PillStatus | 'all'; label: string }[] = [
  { key: 'all',                    label: 'Все' },
  { key: PillStatus.expired,       label: 'Просрочено' },
  { key: PillStatus.expiring_soon, label: 'Истекает' },
  { key: PillStatus.ok,            label: 'В порядке' },
];

// ══════════════════════════════════════════════════════════════════════════════
// Модалка удаления лекарства
// ══════════════════════════════════════════════════════════════════════════════
function DeleteModal({ visible, pillName, onConfirm, onClose }: {
  visible: boolean; pillName: string; onConfirm: () => void; onClose: () => void;
}) {
  const scale   = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={dm.backdrop} onPress={onClose}>
        <Animated.View style={[dm.sheet, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>
            <View style={dm.topBar} />
            <View style={dm.body}>
              <View style={dm.iconWrap}>
                <Text style={dm.iconEmoji}>🗑</Text>
              </View>
              <Text style={dm.title}>Удалить?</Text>
              <Text style={dm.message}>
                Вы удалите лекарство{'\n'}
                <Text style={dm.accent}>«{pillName}»</Text> из аптечки.{'\n'}
                <Text style={dm.messageSmall}>Это действие нельзя отменить.</Text>
              </Text>
              <View style={dm.btnRow}>
                <Pressable
                  style={({ pressed }) => [dm.btnCancel, pressed && dm.pressed]}
                  onPress={onClose}
                >
                  <Text style={dm.btnCancelText}>Отмена</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [dm.btnConfirm, pressed && dm.pressed]}
                  onPress={() => { onConfirm(); onClose(); }}
                >
                  <Text style={dm.btnConfirmText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const dm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(45,58,50,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  sheet: {
    width: '100%', backgroundColor: C.white, borderRadius: 28, overflow: 'hidden',
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 32, elevation: 16,
  },
  topBar: { height: 5, backgroundColor: C.red },
  body: { padding: 28, paddingTop: 24, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.redPale, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 34 },
  title: { fontSize: 22, fontWeight: '800', color: C.charcoal, letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: C.stone, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  messageSmall: { fontSize: 13, color: C.stone, fontWeight: '600' },
  accent: { fontWeight: '800', color: C.red },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: '#E8E0D4',
  },
  btnConfirm: {
    flex: 1.4, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.red,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  pressed: { opacity: 0.82 },
  btnCancelText: { fontSize: 15, fontWeight: '800', color: C.stone },
  btnConfirmText: { fontSize: 15, fontWeight: '800', color: C.white },
});

// ══════════════════════════════════════════════════════════════════════════════
// Главный экран
// ══════════════════════════════════════════════════════════════════════════════
export default function PillsScreen() {
  const {
    pills, loading, error, familyUuid,
    sortKey, setSortKey,
    filterStatus, setFilterStatus,
    add, update, remove,
  } = usePills();

  const [formVisible, setFormVisible]   = useState(false);
  const [editTarget, setEditTarget]     = useState<TPill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TPill | null>(null);

  const openAdd  = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit = (pill: TPill) => { setEditTarget(pill); setFormVisible(true); };

  const handleSave = async (data: TCreatePill) => {
    if (editTarget) await update(editTarget.id, data);
    else await add(data);
    setFormVisible(false);
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

  const expiredCount = pills.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date()).length;
  const totalCount   = pills.length;

  return (
    <View style={styles.root}>

      {/* ── Шапка ── */}
      <View style={styles.header}>
        <PillsHero
          width="100%"
          height={130}
          style={styles.heroImage}
          preserveAspectRatio="xMidYMid slice"
        />
        <View style={styles.headerOverlay}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Аптечка</Text>
              <Text style={styles.headerSub}>
                {totalCount} лекарств{expiredCount > 0 ? ` · ${expiredCount} просрочено` : ''}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
              onPress={openAdd}
            >
              <Text style={styles.addBtnText}>+ Добавить</Text>
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
                <Text style={[styles.filterLabel, filterStatus === opt.key && styles.filterLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : pills.length === 0 ? (
        <View style={styles.centered}>
          <PillsEmpty width={160} height={160} />
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
            <PillCard
              key={pill.id}
              pill={pill}
              onEdit={openEdit}
              onDelete={(pill) => setDeleteTarget(pill)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Форма ── */}
      <PillForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />

      {/* ── Модалка удаления ── */}
      <DeleteModal
        visible={!!deleteTarget}
        pillName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && remove(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { position: 'relative', overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerOverlay: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: 'rgba(78,143,173,0.82)',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2 },

  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  addBtnPressed: { backgroundColor: 'rgba(255,255,255,0.35)' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  filterLabelActive: { color: C.skyDark },

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

  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal, marginBottom: 6, marginTop: 8 },
  emptyText:  { fontSize: 14, color: C.stone, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  errorText:  { fontSize: 14, color: C.red, textAlign: 'center', fontWeight: '700' },
});