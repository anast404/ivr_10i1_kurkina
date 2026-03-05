import { TPill } from '@/types/pill';
import { getPillStatus, PILL_STATUS_COLOR, PILL_STATUS_LABEL } from '@/hooks/use-pills';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const C = {
  skyDark:  '#4E8FAD',
  skyPale:  '#EBF4FF',
  charcoal: '#2D3A32',
  stone:    '#8A9488',
  white:    '#FFFFFF',
  bg:       '#F2F7FA',
};

type TPillCardProps = {
  pill: TPill;
  onEdit: (pill: TPill) => void;
  onDelete: (pill: TPill) => void;
};

export function PillCard({ pill, onEdit, onDelete }: TPillCardProps) {
  const status      = getPillStatus(pill.expiresAt);
  const statusColor = PILL_STATUS_COLOR[status];
  const statusLabel = PILL_STATUS_LABEL[status];

  const expiresDate = new Date(pill.expiresAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const daysLeft = Math.floor(
    (new Date(pill.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.card}>
      {/* Левый цветной бордер */}
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        {/* Верхняя строка: название + кнопки */}
        <View style={styles.topRow}>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{pill.name}</Text>
            {pill.description ? (
              <Text style={styles.desc} numberOfLines={1}>{pill.description}</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: C.skyPale }]}
              onPress={() => onEdit(pill)}
            >
              <Text style={[styles.actionBtnText, { color: C.skyDark }]}>✎</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: '#FDEAEA' }]}
              onPress={() => onDelete(pill)}
            >
              <Text style={[styles.actionBtnText, { color: '#D95B5B' }]}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Нижняя строка: статус + срок */}
        <View style={styles.bottomRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          <View style={styles.expiryWrap}>
            {pill.quantity ? (
              <Text style={styles.quantity}>{pill.quantity}</Text>
            ) : null}
            <Text style={styles.expiryDate}>до {expiresDate}</Text>
            {daysLeft >= 0 && daysLeft <= 60 ? (
              <Text style={[styles.daysLeft, { color: statusColor }]}>
                {daysLeft === 0 ? 'истекает сегодня' : `${daysLeft} дн.`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#2D3A32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  accentBar: { width: 5 },
  body: { flex: 1, padding: 14 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  nameWrap: { flex: 1, marginRight: 8 },
  name: { fontSize: 16, fontWeight: '800', color: '#2D3A32', letterSpacing: -0.2 },
  desc: { fontSize: 12, color: '#8A9488', fontWeight: '600', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '800' },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  expiryWrap: { alignItems: 'flex-end', gap: 1 },
  quantity:   { fontSize: 11, color: '#8A9488', fontWeight: '600' },
  expiryDate: { fontSize: 12, color: '#8A9488', fontWeight: '700' },
  daysLeft:   { fontSize: 11, fontWeight: '800' },
});