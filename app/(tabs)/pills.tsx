import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PillsScreen() {
  return (
    <ScrollView>
      <View style={styles.titleContainer}>
        <Text>Аптечка</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
