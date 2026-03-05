import { TPlant, WATER_FREQUENCY_DAYS, WATER_FREQUENCY_LABEL } from '@/types/plant';
import { getWaterStatus, daysUntilWater, WATER_STATUS_COLOR, WATER_STATUS_LABEL } from '@/hooks/use-plants';
import { TCareRecord } from '@/types/plant';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StyledText } from '../atom/styled-text';
import { IconedButton } from '../atom/iconned-button';
import { ICONS } from '@/constants';

type TPlantCardProps = {
  plant: TPlant;
  onEdit: (plant: TPlant) => void;
  onDelete: (plant: TPlant) => void;
  onWater: (plantId: string, note?: string) => void;
  getHistory: (plantId: string) => Promise<TCareRecord[]>;
};

export function PlantCard({ plant, onEdit, onDelete, onWater, getHistory }: TPlantCardProps) {
  const freqDays = WATER_FREQUENCY_DAYS[plant.waterFrequency];
  const status = getWaterStatus(plant.lastWateredAt, freqDays);
  const statusColor = WATER_STATUS_COLOR[status];
  const statusLabel = WATER_STATUS_LABEL[status];
  const days = daysUntilWater(plant.lastWateredAt, freqDays);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<TCareRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleWater = () => {
    Alert.alert(
      '💧 Полив',
      `Отметить полив растения «${plant.name}»?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Полить', onPress: () => onWater(plant.id) },
      ]
    );
  };

  const openHistory = async () => {
    setHistoryLoading(true);
    setHistoryVisible(true);
    const records = await getHistory(plant.id);
    setHistory(records);
    setHistoryLoading(false);
  };

  const lastWateredDate = new Date(plant.lastWateredAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <>
      <View style={styles.card}>
        {/* Цветовой индикатор */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <StyledText style={styles.name}>{plant.name}</StyledText>
            <View style={styles.actions}>
              <IconedButton iconName={ICONS.edit} onPress={() => onEdit(plant)} color="#666" />
              <IconedButton iconName={ICONS.close} onPress={() => onDelete(plant)} color="#F44336" />
            </View>
          </View>

          {plant.description ? (
            <StyledText style={styles.description}>{plant.description}</StyledText>
          ) : null}

          <View style={styles.infoRow}>
            <StyledText style={styles.infoText}>
              🔄 {WATER_FREQUENCY_LABEL[plant.waterFrequency]}
            </StyledText>
            <StyledText style={styles.infoText}>
              💧 Полит: {lastWateredDate}
            </StyledText>
          </View>

          <View style={styles.footer}>
            <View>
              <StyledText style={[styles.status, { color: statusColor }]}>
                {statusLabel}
              </StyledText>
              <StyledText style={styles.daysText}>
                {days > 0
                  ? `Следующий полив через ${days} дн.`
                  : days === 0
                  ? 'Полить сегодня!'
                  : `Просрочено на ${Math.abs(days)} дн.`}
              </StyledText>
            </View>

            <View style={styles.footerButtons}>
              <Pressable style={styles.historyBtn} onPress={openHistory}>
                <StyledText style={styles.historyBtnText}>История</StyledText>
              </Pressable>
              <Pressable style={[styles.waterBtn, { backgroundColor: statusColor }]} onPress={handleWater}>
                <StyledText style={styles.waterBtnText}>💧 Полить</StyledText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Модальное окно истории */}
      <Modal visible={historyVisible} animationType="slide" transparent onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.historySheet}>
            <View style={styles.historyHeader}>
              <StyledText style={styles.historyTitle}>История ухода: {plant.name}</StyledText>
              <Pressable onPress={() => setHistoryVisible(false)}>
                <StyledText style={styles.closeBtn}>✕</StyledText>
              </Pressable>
            </View>
            {historyLoading ? (
              <StyledText style={styles.emptyText}>Загрузка...</StyledText>
            ) : history.length === 0 ? (
              <StyledText style={styles.emptyText}>История пуста</StyledText>
            ) : (
              <ScrollView>
                {history.map((record) => (
                  <View key={record.id} style={styles.historyItem}>
                    <StyledText style={styles.historyDate}>
                      💧 {new Date(record.date).toLocaleDateString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </StyledText>
                    {record.note ? (
                      <StyledText style={styles.historyNote}>{record.note}</StyledText>
                    ) : null}
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
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  waterBtn: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  waterBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  historyBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyBtnText: {
    fontSize: 13,
    color: '#555',
  },
  // История
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  historySheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    fontSize: 20,
    color: '#888',
    padding: 4,
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyNote: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
});
