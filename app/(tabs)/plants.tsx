import { usePlants } from '@/hooks/use-plants';
import { TPlant, TCreatePlant } from '@/types/plant';
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
import { PlantCard } from '@/components/organism/plant-card';
import { PlantForm } from '@/components/organism/plant-form';

export default function PlantsScreen() {
  const {
    plants,
    loading,
    error,
    familyUuid,
    add,
    update,
    remove,
    water,
    getHistory,
  } = usePlants();

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<TPlant | null>(null);

  const openAdd = () => {
    setEditTarget(null);
    setFormVisible(true);
  };

  const openEdit = (plant: TPlant) => {
    setEditTarget(plant);
    setFormVisible(true);
  };

  const handleSave = async (data: TCreatePlant) => {
    if (editTarget) {
      await update(editTarget.id, data);
    } else {
      await add(data);
    }
    setFormVisible(false);
  };

  const handleDelete = (plant: TPlant) => {
    Alert.alert(
      'Удалить растение',
      `Удалить «${plant.name}» из картотеки?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => remove(plant.id) },
      ]
    );
  };

  if (!familyUuid) {
    return (
      <View style={styles.centered}>
        <StyledText style={styles.emptyText}>
          Создайте или присоединитесь к семье в разделе «Профиль», чтобы использовать картотеку растений.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Шапка */}
      <View style={styles.topBar}>
        <StyledText style={styles.screenTitle}>🌿 Растения</StyledText>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <StyledText style={styles.addBtnText}>＋ Добавить</StyledText>
        </Pressable>
      </View>

      {/* Список */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <StyledText style={styles.errorText}>{error}</StyledText>
        </View>
      ) : plants.length === 0 ? (
        <View style={styles.centered}>
          <StyledText style={styles.emptyText}>
            Картотека пуста.{'\n'}Добавьте первое растение!
          </StyledText>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onEdit={openEdit}
              onDelete={handleDelete}
              onWater={water}
              getHistory={getHistory}
            />
          ))}
        </ScrollView>
      )}

      {/* Форма */}
      <PlantForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

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
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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