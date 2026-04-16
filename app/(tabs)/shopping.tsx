import { useShoppingItems, getShoppingStatus, SHOPPING_STATUS_COLOR, SHOPPING_STATUS_LABEL, ShoppingSortKey } from '@/hooks/use-shopping';
import { TShoppingItem, TCreateShoppingItem, ShoppingItemStatus, ShoppingFrequency, SHOPPING_FREQUENCY_LABEL } from '@/types/shopping';
import { isValid, runValidation, shoppingValidationRules, ValidationErrors } from '@/utils/validation';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// ─── Палитра ────────────────────────────────────────────────────────────────
const C = {
  teal:      '#4E9E8F',
  tealDark:  '#2D7A6C',
  tealLight: '#A8D5CE',
  tealPale:  '#E8F6F4',
  cream:     '#FAF6EF',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  red:       '#D95B5B',
  redPale:   '#FDEAEA',
  green:     '#4CAF50',
  greenPale: '#E8F5E9',
  orange:    '#E8973A',
  orangePale:'#FFF3E0',
  bg:        '#F2FAF8',
};

const SORT_OPTIONS: { key: ShoppingSortKey; label: string }[] = [
  { key: 'date',     label: 'По дате' },
  { key: 'name',     label: 'По назв.' },
  { key: 'status',   label: 'По статусу' },
  { key: 'category', label: 'По катег.' },
];

const FREQUENCY_OPTIONS = Object.values(ShoppingFrequency);

// ── Утилиты дат ──────────────────────────────────────────────────────────────
function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function parseDate(str: string): string {
  const parts = str.split('.');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? '' : date.toISOString();
}

// ══════════════════════════════════════════════════════════════════════════════
// Анимированный контейнер для модалок
// ══════════════════════════════════════════════════════════════════════════════
function AnimSheet({ visible, onClose, children }: {
  visible: boolean; onClose: () => void; children: React.ReactNode;
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
      <Pressable style={md.backdrop} onPress={onClose}>
        <Animated.View style={[md.sheet, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>{children}</Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Модалка удаления
// ══════════════════════════════════════════════════════════════════════════════
function DeleteModal({ visible, itemName, onConfirm, onClose }: {
  visible: boolean; itemName: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <AnimSheet visible={visible} onClose={onClose}>
      <View style={[md.topBar, { backgroundColor: C.red }]} />
      <View style={md.body}>
        <View style={[md.iconWrap, { backgroundColor: C.redPale }]}>
          <Text style={md.iconEmoji}>🗑</Text>
        </View>
        <Text style={md.title}>Удалить?</Text>
        <Text style={md.message}>
          Вы удалите товар{'\n'}
          <Text style={[md.accent, { color: C.red }]}>«{itemName}»</Text>{'\n'}
          <Text style={md.messageSmall}>Это действие нельзя отменить.</Text>
        </Text>
        <View style={md.btnRow}>
          <Pressable style={({ pressed }) => [md.btnCancel, pressed && md.pressed]} onPress={onClose}>
            <Text style={md.btnCancelText}>Отмена</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [md.btnConfirm, { backgroundColor: C.red }, pressed && md.pressed]}
            onPress={() => { onConfirm(); onClose(); }}
          >
            <Text style={md.btnConfirmText}>Удалить</Text>
          </Pressable>
        </View>
      </View>
    </AnimSheet>
  );
}

const md = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(45,58,50,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  sheet: {
    width: '100%', backgroundColor: C.white, borderRadius: 28, overflow: 'hidden',
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 32, elevation: 16,
  },
  topBar: { height: 5 },
  body:   { padding: 28, paddingTop: 24, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconEmoji: { fontSize: 34 },
  title: { fontSize: 22, fontWeight: '800', color: C.charcoal, letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: C.stone, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  messageSmall: { fontSize: 13, color: C.stone, fontWeight: '600' },
  accent: { fontWeight: '800' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: '#E8E0D4',
  },
  btnConfirm: {
    flex: 1.4, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  pressed: { opacity: 0.82 },
  btnCancelText: { fontSize: 15, fontWeight: '800', color: C.stone },
  btnConfirmText: { fontSize: 15, fontWeight: '800', color: C.white },
});

// ══════════════════════════════════════════════════════════════════════════════
// Форма добавления / редактирования
// ══════════════════════════════════════════════════════════════════════════════
function ItemForm({ visible, initial, onSave, onClose }: {
  visible: boolean;
  initial?: TShoppingItem | null;
  onSave: (data: TCreateShoppingItem) => void;
  onClose: () => void;
}) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [category, setCategory]   = useState(initial?.category ?? '');
  const [quantity, setQuantity]   = useState(initial?.quantity ?? '');
  const [dateStr, setDateStr]     = useState(initial?.buyByDate ? fmtDate(initial.buyByDate) : '');
  const [frequency, setFrequency] = useState<ShoppingFrequency>(
    initial?.frequency ?? ShoppingFrequency.once,
  );
  const [focused, setFocused]   = useState<string | null>(null);
  const [errors, setErrors]     = useState<ValidationErrors>({});

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setCategory(initial?.category ?? '');
      setQuantity(initial?.quantity ?? '');
      setDateStr(initial?.buyByDate ? fmtDate(initial.buyByDate) : '');
      setFrequency(initial?.frequency ?? ShoppingFrequency.once);
      setErrors({});
    }
  }, [visible]);

  const clearError = (field: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const handleSave = () => {
    const errs = runValidation({ name, dateStr }, shoppingValidationRules);
    if (!isValid(errs)) { setErrors(errs); return; }

    onSave({
      name: name.trim(),
      category: category.trim() || undefined,
      quantity: quantity.trim() || undefined,
      buyByDate: dateStr ? parseDate(dateStr) || undefined : undefined,
      frequency,
    });
    onClose();
  };

  const inp = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ff.overlay}>
        <View style={ff.sheet}>
          <View style={ff.handle} />
          <View style={ff.header}>
            <Text style={ff.title}>{initial ? 'Редактировать' : 'Добавить товар'}</Text>
            <Pressable style={ff.closeBtn} onPress={onClose}>
              <Text style={ff.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Название */}
            <Text style={ff.label}>Название *</Text>
            <TextInput
              style={[ff.input, focused === 'name' && ff.inputFocused, errors.name && ff.inputError]}
              placeholder="Например: Молоко"
              placeholderTextColor={C.stone}
              value={name}
              onChangeText={(v) => { setName(v); clearError('name'); }}
              {...inp('name')}
            />
            {errors.name ? <Text style={ff.error}>{errors.name}</Text> : null}

            {/* Категория */}
            <Text style={ff.label}>Категория</Text>
            <TextInput
              style={[ff.input, focused === 'cat' && ff.inputFocused]}
              placeholder="Молочное, овощи, бытовое..."
              placeholderTextColor={C.stone}
              value={category}
              onChangeText={setCategory}
              {...inp('cat')}
            />

            {/* Количество */}
            <Text style={ff.label}>Количество</Text>
            <TextInput
              style={[ff.input, focused === 'qty' && ff.inputFocused]}
              placeholder="2 кг, 1 упаковка..."
              placeholderTextColor={C.stone}
              value={quantity}
              onChangeText={setQuantity}
              {...inp('qty')}
            />

            {/* Дата закупки */}
            <Text style={ff.label}>Дата закупки</Text>
            <TextInput
              style={[ff.input, focused === 'date' && ff.inputFocused, errors.dateStr && ff.inputError]}
              placeholder="ДД.ММ.ГГГГ"
              placeholderTextColor={C.stone}
              value={dateStr}
              onChangeText={(v) => { setDateStr(v); clearError('dateStr'); }}
              keyboardType="numeric"
              maxLength={10}
              {...inp('date')}
            />
            {errors.dateStr ? <Text style={ff.error}>{errors.dateStr}</Text> : null}

            {/* Периодичность */}
            <Text style={ff.label}>Периодичность</Text>
            <View style={ff.freqGrid}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[ff.freqChip, frequency === opt && ff.freqChipActive]}
                  onPress={() => setFrequency(opt)}
                >
                  <Text style={[ff.freqChipText, frequency === opt && ff.freqChipTextActive]}>
                    {SHOPPING_FREQUENCY_LABEL[opt]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={ff.btnRow}>
              <Pressable
                style={({ pressed }) => [ff.btnCancel, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={ff.btnCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [ff.btnSave, pressed && { opacity: 0.85 }]}
                onPress={handleSave}
              >
                <Text style={ff.btnSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ff = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingTop: 12, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDE5E0', alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: C.charcoal },
  closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: C.tealPale, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: C.stone, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#D8EAE7', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '600', color: C.charcoal,
    backgroundColor: C.cream, marginBottom: 16,
  },
  inputFocused: { borderColor: C.teal, backgroundColor: C.white },
  inputError:   { borderColor: C.red },
  error: { color: C.red, fontSize: 12, fontWeight: '700', marginTop: -12, marginBottom: 12 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  freqChip: { borderRadius: 99, borderWidth: 1.5, borderColor: '#D8EAE7', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.cream },
  freqChipActive: { backgroundColor: C.tealDark, borderColor: C.tealDark },
  freqChipText: { fontSize: 13, fontWeight: '700', color: C.stone },
  freqChipTextActive: { color: C.white },
  btnRow: { flexDirection: 'row', gap: 10, paddingBottom: 20 },
  btnCancel: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: '#E0E8E4',
  },
  btnCancelText: { fontSize: 15, fontWeight: '800', color: C.stone },
  btnSave: {
    flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.tealDark,
    shadowColor: C.tealDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnSaveText: { fontSize: 15, fontWeight: '800', color: C.white },
});

// ══════════════════════════════════════════════════════════════════════════════
// Карточка товара
// ══════════════════════════════════════════════════════════════════════════════
function ShoppingCard({ item, onEdit, onDelete, onToggle }: {
  item: TShoppingItem;
  onEdit: (item: TShoppingItem) => void;
  onDelete: (item: TShoppingItem) => void;
  onToggle: (id: string, bought: boolean) => void;
}) {
  const status      = getShoppingStatus(item);
  const statusColor = SHOPPING_STATUS_COLOR[status];
  const statusLabel = SHOPPING_STATUS_LABEL[status];

  return (
    <View style={[sc.card, item.bought && sc.cardBought]}>
      <View style={[sc.accentBar, { backgroundColor: statusColor }]} />

      <Pressable
        style={[sc.checkbox, item.bought && { backgroundColor: C.green, borderColor: C.green }]}
        onPress={() => onToggle(item.id, !item.bought)}
      >
        {item.bought ? <Text style={sc.checkmark}>✓</Text> : null}
      </Pressable>

      <View style={sc.body}>
        <View style={sc.topRow}>
          <View style={sc.nameWrap}>
            <Text style={[sc.name, item.bought && sc.nameBought]}>{item.name}</Text>
            {item.category ? (
              <View style={sc.categoryBadge}>
                <Text style={sc.categoryText}>{item.category}</Text>
              </View>
            ) : null}
          </View>
          <View style={sc.actions}>
            <Pressable
              style={[sc.actionBtn, { backgroundColor: C.tealPale }]}
              onPress={() => onEdit(item)}
            >
              <Text style={[sc.actionBtnText, { color: C.tealDark }]}>✎</Text>
            </Pressable>
            <Pressable
              style={[sc.actionBtn, { backgroundColor: C.redPale }]}
              onPress={() => onDelete(item)}
            >
              <Text style={[sc.actionBtnText, { color: C.red }]}>✕</Text>
            </Pressable>
          </View>
        </View>

        <View style={sc.bottomRow}>
          <View style={[sc.statusBadge, { backgroundColor: statusColor + '1A' }]}>
            <View style={[sc.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[sc.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          <View style={sc.metaWrap}>
            {item.quantity ? (
              <Text style={sc.metaText}> {item.quantity}</Text>
            ) : null}
            {item.buyByDate ? (
              <Text style={sc.metaText}> до {fmtDate(item.buyByDate)}</Text>
            ) : null}
            {item.frequency !== ShoppingFrequency.once ? (
              <Text style={sc.repeatText}>🔄 {SHOPPING_FREQUENCY_LABEL[item.frequency]}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: C.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cardBought: { opacity: 0.6 },
  accentBar:  { width: 5, alignSelf: 'stretch' },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: C.tealLight,
    marginHorizontal: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { fontSize: 14, color: C.white, fontWeight: '800' },
  body: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  nameWrap: { flex: 1, marginRight: 8, gap: 4 },
  name: { fontSize: 15, fontWeight: '800', color: C.charcoal },
  nameBought: { textDecorationLine: 'line-through', color: C.stone },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: C.tealPale, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontSize: 11, fontWeight: '700', color: C.tealDark },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  metaWrap: { alignItems: 'flex-end', gap: 1 },
  metaText: { fontSize: 11, color: C.stone, fontWeight: '600' },
  repeatText: { fontSize: 11, color: C.teal, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════════════════
// Главный экран
// ══════════════════════════════════════════════════════════════════════════════
export default function ShoppingScreen() {
  const {
    items, loading, error, familyUuid,
    sortKey, setSortKey,
    showBought, setShowBought,
    pendingCount, boughtCount, overdueCount,
    add, update, toggleBought, remove,
  } = useShoppingItems();

  const [formVisible, setFormVisible]   = useState(false);
  const [editTarget, setEditTarget]     = useState<TShoppingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TShoppingItem | null>(null);

  const openAdd  = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit = (item: TShoppingItem) => { setEditTarget(item); setFormVisible(true); };

  const handleSave = async (data: TCreateShoppingItem) => {
    if (editTarget) await update(editTarget.id, data);
    else await add(data);
    setFormVisible(false);
  };

  if (!familyUuid) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <View style={s.headerOverlay}>
            <Text style={s.headerLabel}>СПИСОК</Text>
            <Text style={s.headerTitle}>Покупки</Text>
          </View>
        </View>
        <View style={s.centered}>
          <Text style={s.emptyEmoji}>🏠</Text>
          <Text style={s.emptyTitle}>Нет семьи</Text>
          <Text style={s.emptyText}>Создайте или присоединитесь к семье в разделе «Профиль»</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* ── Шапка ── */}
      <View style={s.header}>
        <View style={s.headerOverlay}>
          <View style={s.headerContent}>
            <View>
              <Text style={s.headerLabel}>СПИСОК</Text>
              <Text style={s.headerTitle}>Покупки</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}
              onPress={openAdd}
            >
              <Text style={s.addBtnText}>+ Добавить</Text>
            </Pressable>
          </View>

          <View style={s.stats}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{pendingCount}</Text>
              <Text style={s.statLabel}>Нужно купить</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNum, overdueCount > 0 && { color: '#FFB3B3' }]}>{overdueCount}</Text>
              <Text style={s.statLabel}>Просрочено</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{boughtCount}</Text>
              <Text style={s.statLabel}>Куплено</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Панель управления ── */}
      <View style={s.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={s.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[s.sortChip, sortKey === opt.key && s.sortChipActive]}
                onPress={() => setSortKey(opt.key)}
              >
                <Text style={[s.sortChipText, sortKey === opt.key && s.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Pressable
          style={[s.toggleBtn, showBought && s.toggleBtnActive]}
          onPress={() => setShowBought(!showBought)}
        >
          <Text style={[s.toggleBtnText, showBought && s.toggleBtnTextActive]}>
            {showBought ? '✓ Куплено' : 'Куплено'}
          </Text>
        </Pressable>
      </View>

      {/* ── Список ── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.teal} />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyEmoji}>🛒</Text>
          <Text style={s.emptyTitle}>
            {showBought ? 'Список пуст' : 'Всё куплено!'}
          </Text>
          <Text style={s.emptyText}>
            {showBought
              ? 'Добавьте первый товар в список покупок'
              : 'Добавьте новые товары или показывайте уже купленные'}
          </Text>
          <Pressable style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>+ Добавить товар</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <ShoppingCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={(i) => setDeleteTarget(i)}
              onToggle={toggleBought}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Форма ── */}
      <ItemForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />

      {/* ── Модалка удаления ── */}
      <DeleteModal
        visible={!!deleteTarget}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && remove(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}

// ─── Стили главного экрана ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { overflow: 'hidden' },
  headerOverlay: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: C.tealDark },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.white, marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  addBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: C.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#EEF0EE', gap: 8 },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortChip: { borderRadius: 8, borderWidth: 1.5, borderColor: '#D8EAE7', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.white },
  sortChipActive: { backgroundColor: C.tealPale, borderColor: C.teal },
  sortChipText: { fontSize: 12, fontWeight: '700', color: C.stone },
  sortChipTextActive: { color: C.tealDark },
  toggleBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#D8EAE7', paddingHorizontal: 10, paddingVertical: 4 },
  toggleBtnActive: { backgroundColor: C.tealPale, borderColor: C.teal },
  toggleBtnText: { fontSize: 12, fontWeight: '700', color: C.stone },
  toggleBtnTextActive: { color: C.tealDark },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal, marginBottom: 6, marginTop: 8 },
  emptyText:  { fontSize: 14, color: C.stone, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  emptyBtn: { marginTop: 20, backgroundColor: C.tealDark, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  errorText: { color: C.red, fontSize: 15, textAlign: 'center', fontWeight: '600' },
});