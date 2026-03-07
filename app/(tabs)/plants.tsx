import { usePlants } from '@/hooks/use-plants';
import { TPlant, TCreatePlant, WATER_FREQUENCY_DAYS, WATER_FREQUENCY_LABEL } from '@/types/plant';
import { getWaterStatus, daysUntilWater, WATER_STATUS_COLOR, WATER_STATUS_LABEL } from '@/hooks/use-plants';
import { TCareRecord } from '@/types/plant';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── SVG иллюстрации ────────────────────────────────────────────────────────
import PlantsHero  from '@/assets/images/plants-hero.svg';
import PlantsEmpty from '@/assets/images/plants-empty.svg';
// иконки статуса полива в карточке
import PlantOk       from '@/assets/images/plant-ok.svg';
import PlantDueToday from '@/assets/images/plant-due-today.svg';
import PlantOverdue  from '@/assets/images/plant-overdue.svg';
import WateringCan   from '@/assets/images/watering-can.svg';

// ─── Палитра ────────────────────────────────────────────────────────────────
const C = {
  sageDark:  '#4E7D62',
  sage:      '#7BAF8E',
  sageLight: '#B2D4BC',
  sagePale:  '#EEF7F1',
  cream:     '#FAF6EF',
  warm:      '#F0E8D8',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  red:       '#D95B5B',
  orange:    '#E8973A',
  green:     '#5BA86A',
  sky:       '#7AAFC9',
};

import { WaterFrequency, WaterStatus } from '@/types/plant';
import { getCareRecords, waterPlant } from '@/utils/plants-store';
import { getDocument } from '@/utils/firebase-store';
import useUserStore from '@/state/user';
import { useCallback, useEffect } from 'react';
import { getPlants, addPlant, updatePlant, deletePlant } from '@/utils/plants-store';

const FREQUENCY_OPTIONS = Object.values(WaterFrequency);

// ─── Маппинг иконок статуса полива ──────────────────────────────────────────
const WaterStatusIcon = {
  [WaterStatus.ok]:        PlantOk,
  [WaterStatus.due_today]: PlantDueToday,
  [WaterStatus.overdue]:   PlantOverdue,
};

// ─── Форма растения ──────────────────────────────────────────────────────────
function PlantFormModal({
  visible, initial, onSave, onClose,
}: {
  visible: boolean;
  initial?: TPlant | null;
  onSave: (data: TCreatePlant) => void;
  onClose: () => void;
}) {
  const [name, setName]               = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequency, setFrequency]     = useState<WaterFrequency>(initial?.waterFrequency ?? WaterFrequency.weekly);
  const [nameError, setNameError]     = useState('');

  const handleSave = () => {
    if (!name.trim()) { setNameError('Введите название'); return; }
    onSave({
      name: name.trim(),
      description: description.trim(),
      waterFrequency: frequency,
      lastWateredAt: initial?.lastWateredAt ?? new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={fs.overlay}>
        <View style={fs.sheet}>
          <View style={fs.header}>
            <Text style={fs.title}>{initial ? 'Редактировать' : 'Новое растение'}</Text>
            <TouchableOpacity onPress={onClose} style={fs.closeBtn}>
              <Text style={fs.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={fs.label}>Название</Text>
            <TextInput
              style={[fs.input, nameError ? fs.inputError : null]}
              placeholder="Например: Фикус"
              placeholderTextColor={C.stone}
              value={name}
              onChangeText={(v) => { setName(v); setNameError(''); }}
            />
            {nameError ? <Text style={fs.error}>{nameError}</Text> : null}

            <Text style={fs.label}>Особенности ухода</Text>
            <TextInput
              style={[fs.input, fs.multiline]}
              placeholder="Любит свет, не переносит сквозняки..."
              placeholderTextColor={C.stone}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={fs.label}>Частота полива</Text>
            <View style={fs.freqGrid}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[fs.freqChip, frequency === opt && fs.freqChipActive]}
                  onPress={() => setFrequency(opt)}
                >
                  <Text style={[fs.freqChipText, frequency === opt && fs.freqChipTextActive]}>
                    {WATER_FREQUENCY_LABEL[opt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={fs.btnRow}>
              <Pressable style={fs.btnCancel} onPress={onClose}>
                <Text style={fs.btnCancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={fs.btnSave} onPress={handleSave}>
                <Text style={fs.btnSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Карточка растения ───────────────────────────────────────────────────────
function PlantCard({
  plant, onEdit, onDelete, onWater, getHistory,
}: {
  plant: TPlant;
  onEdit: (p: TPlant) => void;
  onDelete: (p: TPlant) => void;
  onWater: (id: string) => void;
  getHistory: (id: string) => Promise<TCareRecord[]>;
}) {
  const freqDays = WATER_FREQUENCY_DAYS[plant.waterFrequency];
  const status   = getWaterStatus(plant.lastWateredAt, freqDays);
  const color    = WATER_STATUS_COLOR[status];
  const label    = WATER_STATUS_LABEL[status];
  const days     = daysUntilWater(plant.lastWateredAt, freqDays);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory]               = useState<TCareRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const lastDate = new Date(plant.lastWateredAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const handleWater = () => {
    Alert.alert('Полив', `Отметить полив «${plant.name}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Полить', onPress: () => onWater(plant.id) },
    ]);
  };

  const openHistory = async () => {
    setHistoryLoading(true);
    setHistoryVisible(true);
    const r = await getHistory(plant.id);
    setHistory(r);
    setHistoryLoading(false);
  };

  const daysLabel = days > 0
    ? `Следующий полив через ${days} дн.`
    : days === 0
    ? 'Полить сегодня!'
    : `Просрочено на ${Math.abs(days)} дн.`;

  const StatusIcon = WaterStatusIcon[status];

  return (
    <>
      <View style={pc.card}>
        {/* Цветная полоска */}
        <View style={[pc.bar, { backgroundColor: color }]} />

        <View style={pc.body}>
          {/* Заголовок */}
          <View style={pc.header}>
            <View style={pc.iconCircle}>
              <StatusIcon width={28} height={28} />
            </View>
            <View style={pc.titleWrap}>
              <Text style={pc.name}>{plant.name}</Text>
              <Text style={pc.freq}>{WATER_FREQUENCY_LABEL[plant.waterFrequency]}</Text>
            </View>
            <View style={pc.actions}>
              <Pressable style={pc.actionBtn} onPress={() => onEdit(plant)}>
                <Text style={pc.actionBtnText}>✎</Text>
              </Pressable>
              <Pressable style={[pc.actionBtn, pc.actionBtnRed]} onPress={() => onDelete(plant)}>
                <Text style={[pc.actionBtnText, { color: C.red }]}>✕</Text>
              </Pressable>
            </View>
          </View>

          {plant.description ? (
            <Text style={pc.description}>{plant.description}</Text>
          ) : null}

          {/* Статус + дата */}
          <View style={[pc.statusRow, { backgroundColor: color + '15' }]}>
            <View style={[pc.statusDot, { backgroundColor: color }]} />
            <Text style={[pc.statusLabel, { color }]}>{label}</Text>
            <Text style={pc.statusDays}>{daysLabel}</Text>
          </View>

          {/* Последний полив */}
          <Text style={pc.lastWatered}>Последний полив: {lastDate}</Text>

          {/* Кнопки */}
          <View style={pc.btnRow}>
            <Pressable style={pc.historyBtn} onPress={openHistory}>
              <Text style={pc.historyBtnText}>История</Text>
            </Pressable>
            <Pressable style={[pc.waterBtn, { backgroundColor: color }]} onPress={handleWater}>
              <Text style={pc.waterBtnText}>Полить</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* История */}
      <Modal visible={historyVisible} animationType="slide" transparent onRequestClose={() => setHistoryVisible(false)}>
        <View style={hm.overlay}>
          <View style={hm.sheet}>
            <View style={hm.header}>
              <Text style={hm.title}>История: {plant.name}</Text>
              <Pressable onPress={() => setHistoryVisible(false)} style={hm.closeBtn}>
                <Text style={hm.closeBtnText}>✕</Text>
              </Pressable>
            </View>
            {historyLoading ? (
              <ActivityIndicator color={C.sage} style={{ marginTop: 24 }} />
            ) : history.length === 0 ? (
              <Text style={hm.empty}>История пуста</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.map((r) => (
                  <View key={r.id} style={hm.item}>
                    <View style={hm.itemDot} />
                    <View>
                      <Text style={hm.itemDate}>
                        {new Date(r.date).toLocaleDateString('ru-RU', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                      {r.note ? <Text style={hm.itemNote}>{r.note}</Text> : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Главный экран ───────────────────────────────────────────────────────────
export default function PlantsScreen() {
  const { user }                        = useUserStore((s) => s);
  const [plants, setPlants]             = useState<TPlant[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [familyUuid, setFamilyUuid]     = useState<string | null>(null);
  const [formVisible, setFormVisible]   = useState(false);
  const [editTarget, setEditTarget]     = useState<TPlant | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getDocument('users', user.uid).then((data) => {
      if (data?.family_uuid) setFamilyUuid(data.family_uuid);
    });
  }, [user?.uid]);

  const load = useCallback(async () => {
    if (!familyUuid) return;
    setLoading(true); setError(null);
    try {
      const data = await getPlants(familyUuid);
      data.sort((a, b) => {
        const dA = daysUntilWater(a.lastWateredAt, WATER_FREQUENCY_DAYS[a.waterFrequency]);
        const dB = daysUntilWater(b.lastWateredAt, WATER_FREQUENCY_DAYS[b.waterFrequency]);
        return dA - dB;
      });
      setPlants(data);
    } catch (e) {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [familyUuid]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: TCreatePlant) => {
    if (!familyUuid || !user?.uid) return;
    if (editTarget) await updatePlant(editTarget.id, data);
    else await addPlant(data, familyUuid, user.uid);
    setFormVisible(false);
    await load();
  };

  const handleDelete = (plant: TPlant) => {
    Alert.alert('Удалить растение', `Удалить «${plant.name}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => { await deletePlant(plant.id); await load(); } },
    ]);
  };

  const handleWater = async (plantId: string) => {
    if (!familyUuid) return;
    await waterPlant(plantId, familyUuid);
    await load();
  };

  const getHistory = (plantId: string) => getCareRecords(plantId);

  const openAdd  = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit = (p: TPlant) => { setEditTarget(p); setFormVisible(true); };

  return (
    <View style={s.root}>

      <View style={s.header}>
        {/* Иллюстрация на весь фон шапки */}
        <PlantsHero
          width="100%"
          height={160}
          style={s.heroImage}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* Текст поверх иллюстрации */}
        <View style={s.headerOverlay}>
          <View style={s.headerContent}>
            <View>
              <Text style={s.headerLabel}>Картотека</Text>
              <Text style={s.headerTitle}>Растения</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}
              onPress={openAdd}
            >
              <Text style={s.addBtnText}>＋ Добавить</Text>
            </Pressable>
          </View>

          {/* Статистика */}
          {plants.length > 0 && (
            <View style={s.stats}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{plants.length}</Text>
                <Text style={s.statLabel}>всего</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: C.orange }]}>
                  {plants.filter(p => {
                    const st = getWaterStatus(p.lastWateredAt, WATER_FREQUENCY_DAYS[p.waterFrequency]);
                    return st !== 'ok';
                  }).length}
                </Text>
                <Text style={s.statLabel}>нужен полив</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Список ── */}
      {!familyUuid ? (
        <View style={s.centered}>
          <Text style={s.emptyEmoji}>🏠</Text>
          <Text style={s.emptyTitle}>Нет семьи</Text>
          <Text style={s.emptyText}>Создайте или присоединитесь к семье в разделе «Профиль»</Text>
        </View>
      ) : loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.sage} />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : plants.length === 0 ? (
        <View style={s.centered}>
          <PlantsEmpty width={160} height={160} />
          <Text style={s.emptyTitle}>Пока пусто</Text>
          <Text style={s.emptyText}>Добавьте первое растение и следите за его поливом</Text>
          <Pressable style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>＋ Добавить растение</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onEdit={openEdit}
              onDelete={handleDelete}
              onWater={handleWater}
              getHistory={getHistory}
            />
          ))}
        </ScrollView>
      )}

      <PlantFormModal
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

// ─── Стили главного экрана ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  header: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  headerOverlay: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(78,125,98,0.80)', // полупрозрачный sage поверх SVG
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.white, marginTop: 2 },

  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  addBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },

  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: C.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal, marginBottom: 6, marginTop: 8 },
  emptyText: { fontSize: 14, color: C.stone, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  emptyBtn: { marginTop: 20, backgroundColor: C.sageDark, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  errorText: { color: C.red, fontSize: 15, textAlign: 'center', fontWeight: '600' },
});

// ─── Стили карточки ──────────────────────────────────────────────────────────
const pc = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: C.white, borderRadius: 18,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  bar: { width: 5 },
  body: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  titleWrap: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: C.charcoal },
  freq: { fontSize: 12, color: C.stone, fontWeight: '600', marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 99, backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center' },
  actionBtnRed: { backgroundColor: '#FDEAEA' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: C.sageDark },
  description: { fontSize: 13, color: C.stone, fontWeight: '600', marginBottom: 8, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 8, gap: 6, marginBottom: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 99 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  statusDays: { fontSize: 11, color: C.stone, fontWeight: '600', marginLeft: 4 },
  lastWatered: { fontSize: 12, color: C.stone, fontWeight: '600', marginBottom: 10 },
  btnRow: { flexDirection: 'row', gap: 8 },
  historyBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0EBE4', paddingVertical: 8, alignItems: 'center' },
  historyBtnText: { fontSize: 13, fontWeight: '700', color: C.stone },
  waterBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  waterBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waterBtnText: { fontSize: 13, fontWeight: '800', color: C.white },
});

// ─── Стили истории ───────────────────────────────────────────────────────────
const hm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '800', color: C.charcoal, flex: 1 },
  closeBtn: { width: 30, height: 30, borderRadius: 99, backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: C.stone, fontWeight: '700' },
  empty: { textAlign: 'center', color: C.stone, marginTop: 24, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: C.sage, marginTop: 5 },
  itemDate: { fontSize: 14, fontWeight: '700', color: C.charcoal },
  itemNote: { fontSize: 13, color: C.stone, fontWeight: '600', marginTop: 2 },
});

// ─── Стили формы ─────────────────────────────────────────────────────────────
const fs = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: C.charcoal },
  closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 15, color: C.stone, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E0EBE4', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: C.charcoal, backgroundColor: C.cream, marginBottom: 16 },
  inputError: { borderColor: C.red },
  multiline: { height: 80, textAlignVertical: 'top' },
  error: { color: C.red, fontSize: 12, fontWeight: '700', marginTop: -12, marginBottom: 12 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  freqChip: { borderRadius: 99, borderWidth: 1.5, borderColor: '#E0EBE4', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.cream },
  freqChipActive: { backgroundColor: C.sageDark, borderColor: C.sageDark },
  freqChipText: { fontSize: 13, fontWeight: '700', color: C.stone },
  freqChipTextActive: { color: C.white },
  btnRow: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  btnCancel: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0EBE4', paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { fontSize: 15, fontWeight: '700', color: C.stone },
  btnSave: { flex: 1, borderRadius: 14, backgroundColor: C.sageDark, paddingVertical: 14, alignItems: 'center' },
  btnSaveText: { fontSize: 15, fontWeight: '800', color: C.white },
});