import { TPill } from '@/types/pill';
import { getPillStatus, PILL_STATUS_COLOR, PILL_STATUS_LABEL } from '@/hooks/use-pills';
import { Pressable, StyleSheet, View } from 'react-native';
import { StyledText } from '../atom/styled-text';
import { IconedButton } from '../atom/iconned-button';
import { ICONS } from '@/constants';

type TPillCardProps = {
  pill: TPill;
  onEdit: (pill: TPill) => void;
  onDelete: (pill: TPill) => void;
};

export function PillCard({ pill, onEdit, onDelete }: TPillCardProps) {
  const status = getPillStatus(pill.expiresAt);
  const statusColor = PILL_STATUS_COLOR[status];
  const statusLabel = PILL_STATUS_LABEL[status];

  const expiresDate = new Date(pill.expiresAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      {/* Цветовой индикатор статуса */}
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <StyledText style={styles.name}>{pill.name}</StyledText>
          <View style={styles.actions}>
            <IconedButton iconName={ICONS.edit} onPress={() => onEdit(pill)} color="#666" />
            <IconedButton iconName={ICONS.close} onPress={() => onDelete(pill)} color="#F44336" />
          </View>
        </View>

        {pill.description ? (
          <StyledText style={styles.description}>{pill.description}</StyledText>
        ) : null}

        <View style={styles.footer}>
          {pill.quantity ? (
            <StyledText style={styles.quantity}>Кол-во: {pill.quantity}</StyledText>
          ) : null}
          <View style={styles.expiryWrapper}>
            <StyledText style={[styles.status, { color: statusColor }]}>
              {statusLabel}
            </StyledText>
            <StyledText style={styles.expiry}>до {expiresDate}</StyledText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  statusBar: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 13,
    color: '#888',
  },
  expiryWrapper: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiry: {
    fontSize: 12,
    color: '#888',
  },
});
