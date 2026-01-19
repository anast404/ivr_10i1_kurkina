import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PlantsScreen() {
  return (
    <ScrollView>
      <View style={styles.titleContainer}>
        <Text>Цветы</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
