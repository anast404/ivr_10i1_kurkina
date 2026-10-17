import { COLORS as C } from '@/styles/colors';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Section = { icon: string; title: string; items: string[] };

const SECTIONS: Section[] = [
  {
    icon: '🏡',
    title: 'С чего начать',
    items: [
      'Зарегистрируйтесь: введите email и пароль (минимум 6 символов) и нажмите «Создать аккаунт».',
      'Мы отправим письмо со ссылкой. Откройте её и вернитесь в приложение — оно само перейдёт дальше. Если письма нет, нажмите «Отправить письмо снова».',
      'Откройте вкладку «Профиль» и нажмите «Семья»: создайте новую семью или присоединитесь к существующей.',
    ],
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Семья',
    items: [
      'Все данные (лекарства, растения, покупки) общие для участников семьи.',
      'Чтобы пригласить близких, откройте «Семья» и нажмите «Поделиться»: отправьте им идентификатор семьи.',
      'Чтобы присоединиться, откройте «Семья» → «Присоединиться» и вставьте идентификатор.',
      'Выйти из семьи можно там же. Когда выходит последний участник, данные семьи удаляются.',
    ],
  },
  {
    icon: '💊',
    title: 'Аптечка',
    items: [
      'Нажмите «+ Добавить» и укажите название, назначение, срок годности (ДД.ММ.ГГГГ) и количество.',
      'Цвет карточки показывает статус: «В порядке», «Истекает скоро» (до 30 дней) или «Просрочено».',
      'Используйте фильтр по статусу и сортировку (по сроку, названию, статусу) над списком.',
      '✎ на карточке — изменить лекарство, ✕ — удалить (потребуется подтверждение).',
    ],
  },
  {
    icon: '🪴',
    title: 'Растения',
    items: [
      'Нажмите «＋ Добавить», введите название, особенности ухода и выберите, как часто поливать.',
      'Карточка показывает, когда нужен полив: «Полив не нужен», «Полить сегодня» или «Полив просрочен».',
      'Полили растение? Нажмите «Полить» и подтвердите — дата полива и история обновятся.',
      '«История» показывает все поливы с датой и временем, ✎ — редактирование растения.',
    ],
  },
  {
    icon: '🛒',
    title: 'Покупки',
    items: [
      'Нажмите «+ Добавить», введите товар, категорию, количество и срок, к которому его нужно купить.',
      'Если выбрать периодичность (раз в неделю, две недели, месяц), после отметки «Куплено» следующая покупка появится сама.',
      'Купленные товары можно скрыть или показать переключателем над списком.',
      '✎ — изменить покупку, «Удалить» — убрать её из списка.',
    ],
  },
  {
    icon: '👤',
    title: 'Профиль',
    items: [
      'Нажмите на имя или «Изменить», чтобы поменять отображаемое имя.',
      'Кнопка «Выйти из аккаунта» внизу экрана завершает сеанс на этом устройстве.',
    ],
  },
];

export function HelpModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Помощь</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Закрыть">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.intro}>
              HappyHome помогает семье вести аптечку, поливать растения и не забывать о покупках.
            </Text>

            {SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {section.icon} {section.title}
                </Text>
                {section.items.map((item) => (
                  <View key={item} style={styles.itemRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: C.charcoal },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 15, fontWeight: '800', color: C.sageDark },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 14, color: C.stone, fontWeight: '600', lineHeight: 20, marginBottom: 16 },
  section: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.charcoal, marginBottom: 8 },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bullet: { fontSize: 14, color: C.sage, fontWeight: '800', lineHeight: 20 },
  itemText: { flex: 1, fontSize: 14, color: C.charcoal, lineHeight: 20 },
});
