import api from '@/api';
import useUserStore from '@/state/user';
import { COLORS as C } from '@/styles/colors';
import logout from '@/utils/auth';
import { getError } from '@/utils/error';
import { familyCreateRules, familyJoinRules, isValid, runValidation } from '@/utils/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// ══════════════════════════════════════════════════════════════════════════════
// Модалка: Создать / Присоединиться к семье
// ══════════════════════════════════════════════════════════════════════════════
type FamilyTab = 'create' | 'join';

function FamilyModal({ visible, onClose, currentFamilyName, currentFamilyUuid }: {
  visible: boolean;
  onClose: () => void;
  currentFamilyName: string | null;
  currentFamilyUuid: string | null;
}) {
  const [tab, setTab] = useState<FamilyTab>('create');
  const [nameVal, setNameVal] = useState('');
  const [uuidVal, setUuidVal] = useState('');
  const [errorMsg, setError] = useState<string | null>(null);
  const [successMsg, setSucc] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // todo: закрытся с паузой чтоб успеть увидеть тост
  // const onBlocketClose = () => {}

  const queryClient = useQueryClient();

  const createFamilyMutation = useMutation({
    mutationFn: (data: { name: string }) => {
      return api.post('/family/create', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getUser'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
      onClose();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const updateUserFamilyIdMutation = useMutation({
    mutationFn: (data: { family_id: string }) => {
      return api.put('/user/update', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getUser'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
      onClose();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) });
    }
  });

  const deleteUserFamilyIdMutation = useMutation({
    mutationFn: () => {
      return api.delete('/user/leave-family');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getUser'] });
      Toast.show({ type: 'success', text1: data?.data?.message });
      onClose();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) });
    }
  });

  const isLoading = useMemo(() =>
    createFamilyMutation.isPending || updateUserFamilyIdMutation.isPending || deleteUserFamilyIdMutation.isPending,
    [createFamilyMutation.isPending, updateUserFamilyIdMutation.isPending, deleteUserFamilyIdMutation.isPending]
  );

  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.94);
      opacity.setValue(0);
      setError(null); setSucc(null);
      setNameVal(''); setUuidVal('');
    }
  }, [visible]);

  const handleCreate = async () => {
    const errs = runValidation({ name: nameVal }, familyCreateRules);
    if (!isValid(errs)) { setError(errs.name); return; }

    createFamilyMutation.mutate({ name: nameVal.trim() })
  };

  const handleJoin = async () => {
    const errs = runValidation({ uuid: uuidVal }, familyJoinRules);
    if (!isValid(errs)) { setError(errs.uuid); return; }

    updateUserFamilyIdMutation.mutate({ family_id: uuidVal.trim() })
  };

  const shareText = async (text: string) => {
    try {
      await Share.share({
        message: text
      });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: `Oшибка приглашения в семью: ${error?.message || JSON.stringify(error)}` })
    }
  };

  // ── Если семья уже есть — показываем инфо ──
  if (currentFamilyName) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Pressable style={fm.backdrop} onPress={onClose}>
          <Animated.View style={[fm.sheet, { opacity, transform: [{ scale }] }]}>
            <Pressable onPress={() => { }}>
              <View style={[fm.topBar, { backgroundColor: C.sageDark }]} />
              <View style={fm.body}>
                <View style={[fm.iconWrap, { backgroundColor: C.sagePale }]}>
                  <Text style={fm.iconEmoji}>🏡</Text>
                </View>
                <Text style={fm.title}>Ваша семья</Text>
                <View style={fm.familyBadge}>
                  <Text style={fm.familyBadgeText}>{currentFamilyName}</Text>
                </View>
                <Text style={fm.subtitle}>
                  Поделитесь вашим идентификатором{'\n'}с членами семьи для совместного доступа
                </Text>
                <View style={fm.btnRow}>
                  <Pressable
                    style={({ pressed }) => [fm.btnPrimary, pressed && { opacity: 0.85 }]}
                    onPress={() => shareText(`${currentFamilyUuid}`)}
                  >
                    <Text style={fm.btnPrimaryText}>Поделиться</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [fm.btnPrimary, pressed && { opacity: 0.85 }]}
                    onPress={() => deleteUserFamilyIdMutation.mutate() }
                  >
                    <Text style={fm.btnPrimaryText}>Выйти</Text>
                  </Pressable>
                </View>
                <View style={fm.btnRow}>
                  <Pressable
                    style={({ pressed }) => [fm.btnPrimary, pressed && { opacity: 0.85 }]}
                    onPress={onClose}
                  >
                    <Text style={fm.btnPrimaryText}>Понятно</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
        <Toast />
      </Modal>
    );
  }

  // ── Нет семьи — создать или вступить ──
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={fm.backdrop} onPress={onClose}>
        <Animated.View style={[fm.sheet, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => { }}>
            <View style={[fm.topBar, { backgroundColor: C.sageDark }]} />
            <View style={fm.body}>

              <View style={[fm.iconWrap, { backgroundColor: C.sagePale }]}>
                <Text style={fm.iconEmoji}>👨‍👩‍👧</Text>
              </View>
              <Text style={fm.title}>Семья</Text>
              <Text style={fm.subtitle}>
                Создайте или присоединитесь{'\n'}к существующей семье
              </Text>

              {/* Вкладки */}
              <View style={fm.tabs}>
                <Pressable
                  style={[fm.tab, tab === 'create' && fm.tabActive]}
                  onPress={() => { setTab('create'); setError(null); setSucc(null); }}
                >
                  <Text style={[fm.tabText, tab === 'create' && fm.tabTextActive]}>Создать</Text>
                </Pressable>
                <Pressable
                  style={[fm.tab, tab === 'join' && fm.tabActive]}
                  onPress={() => { setTab('join'); setError(null); setSucc(null); }}
                >
                  <Text style={[fm.tabText, tab === 'join' && fm.tabTextActive]}>Присоединиться</Text>
                </Pressable>
              </View>

              {/* Контент вкладки */}
              {tab === 'create' ? (
                <View style={fm.inputWrap}>
                  <Text style={fm.inputLabel}>Название семьи</Text>
                  <TextInput
                    style={[fm.input, focused === 'name' && fm.inputFocused, errorMsg && fm.inputError]}
                    placeholder="Например: Семья Ивановых"
                    placeholderTextColor={C.stone}
                    value={nameVal}
                    onChangeText={(v) => { setNameVal(v); setError(null); }}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              ) : (
                <View style={fm.inputWrap}>
                  <Text style={fm.inputLabel}>Идентификатор семьи</Text>
                  <TextInput
                    style={[fm.input, focused === 'uuid' && fm.inputFocused, errorMsg && fm.inputError]}
                    placeholder="Вставьте идентификатор"
                    placeholderTextColor={C.stone}
                    value={uuidVal}
                    onChangeText={(v) => { setUuidVal(v); setError(null); }}
                    onFocus={() => setFocused('uuid')}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                  />
                  <Text style={fm.hint}>Попросите создателя семьи поделиться{'\n'}идентификатором из раздела «Профиль»</Text>
                </View>
              )}

              {errorMsg ? (
                <View style={fm.errorBox}>
                  <Text style={fm.errorText}>⚠ {errorMsg}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={fm.successBox}>
                  <Text style={fm.successText}>{successMsg}</Text>
                </View>
              ) : null}

              <View style={fm.btnRow}>
                <Pressable
                  style={({ pressed }) => [fm.btnCancel, pressed && { opacity: 0.8 }]}
                  onPress={onClose}
                >
                  <Text style={fm.btnCancelText}>Отмена</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [fm.btnPrimary, isLoading && { opacity: 0.55 }, pressed && { opacity: 0.85 }]}
                  onPress={tab === 'create' ? handleCreate : handleJoin}
                  disabled={isLoading}
                >
                  <Text style={fm.btnPrimaryText}>
                    {isLoading ? '...' : tab === 'create' ? 'Создать' : 'Войти'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
      <Toast />
    </Modal>
  );
}

const fm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: C.overlayCharcoal50,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  sheet: {
    width: '100%', backgroundColor: C.white, borderRadius: 28, overflow: 'hidden',
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 32, elevation: 16,
  },
  topBar: { height: 5 },
  body: { padding: 28, paddingTop: 24, alignItems: 'center' },

  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconEmoji: { fontSize: 34 },
  title: { fontSize: 22, fontWeight: '800', color: C.charcoal, letterSpacing: -0.3, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.stone, fontWeight: '600', textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  tabs: { flexDirection: 'row', backgroundColor: C.sagePale, borderRadius: 16, padding: 4, marginBottom: 20, width: '100%' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  tabActive: {
    backgroundColor: C.white,
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: C.stone },
  tabTextActive: { color: C.sageDark, fontWeight: '800' },

  inputWrap: { width: '100%', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.borderSoft, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '600', color: C.charcoal, backgroundColor: C.cream, marginBottom: 8,
  },
  inputFocused: { borderColor: C.sage, backgroundColor: C.white },
  inputError: { borderColor: C.error },
  hint: { fontSize: 12, color: C.stone, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  errorBox: { backgroundColor: C.errorPale, borderRadius: 12, padding: 12, width: '100%', marginBottom: 12 },
  errorText: { fontSize: 13, fontWeight: '700', color: C.error, textAlign: 'center' },
  successBox: { backgroundColor: C.sagePale, borderRadius: 12, padding: 12, width: '100%', marginBottom: 12 },
  successText: { fontSize: 13, fontWeight: '700', color: C.sageDark, textAlign: 'center' },

  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  btnCancel: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.borderWarm,
  },
  btnCancelText: { fontSize: 15, fontWeight: '800', color: C.stone },
  btnPrimary: {
    flex: 1.4, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.sageDark,
    shadowColor: C.sageDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: C.white },

  familyBadge: { backgroundColor: C.sagePale, borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 12 },
  familyBadgeText: { fontSize: 16, fontWeight: '800', color: C.sageDark },
});

// ══════════════════════════════════════════════════════════════════════════════
// Экран профиля
// ══════════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [familyModalVisible, setFamilyModalVisible] = useState(false);

  const { user } = useUserStore();

  const name = useMemo(() => user?.name ?? "", [user])
  const email = useMemo(() => user?.email ?? "", [user])
  const familyId = useMemo(() => user?.family_id ?? "", [user])

  const queryClient = useQueryClient();

  // todo: isLoading/isError
  const familyQuery = useQuery({
    queryKey: ['getFamily'],
    queryFn: () => api.get(`/family?id=${familyId}`),
    enabled: !!familyId,
    // enabled: false,
  });

  const familyName = useMemo(() => (familyId && familyQuery?.data?.data?.name) ?? "", [familyId, familyQuery])

  const updateUserNameMutation = useMutation({
    mutationFn: (data: { name: string }) => {
      return api.put('/user/update', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getUser'] });
      Toast.show({ type: 'success', text1: data?.data?.message })
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getError(err) })
    }
  });

  const startEdit = () => { setNameInput(name); setEditingName(true); };
  const cancelEdit = () => setEditingName(false);

  const saveName = async () => {
    if (nameInput.trim() && nameInput !== name) {
      updateUserNameMutation.mutate({ name: nameInput.trim() })
    }

    setEditingName(false);
  };

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Шапка ── */}
        <View style={styles.header}>
          <View style={styles.bgCircle} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                selectTextOnFocus
              />
              <Pressable style={styles.iconBtn} onPress={saveName}>
                <Text style={styles.iconBtnText}>✓</Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, styles.iconBtnGray]} onPress={cancelEdit}>
                <Text style={[styles.iconBtnText, { color: C.stone }]}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.nameRow} onPress={startEdit}>
              <Text style={styles.nameText}>{name || 'Имя не указано'}</Text>
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✎</Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* ── Данные акrкаунта ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Данные аккаунта</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIconWrap}><Text style={styles.rowIcon}>👤</Text></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Имя</Text>
                <Text style={styles.rowValue}>{name || '—'}</Text>
              </View>
              <Pressable onPress={startEdit} style={styles.rowAction}>
                <Text style={styles.rowActionText}>Изменить</Text>
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowIconWrap}><Text style={styles.rowIcon}>✉️</Text></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{email || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Семья — теперь открывает красивую модалку ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Моя семья</Text>
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={() => setFamilyModalVisible(true)}>
              <View style={styles.rowIconWrap}><Text style={styles.rowIcon}>👨‍👩‍👧</Text></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Семья</Text>
                <Text style={styles.rowValue}>{familyName ?? 'Не настроено'}</Text>
              </View>
              <View style={styles.rowAction}>
                <Text style={styles.rowActionText}>
                  {familyName ? 'Подробнее' : 'Настроить'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Выход ── */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
          onPress={logout}
        >
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </Pressable>
      </View>

      {/* ── Модалка семьи ── */}
      <FamilyModal
        visible={familyModalVisible}
        onClose={() => setFamilyModalVisible(false)}
        currentFamilyName={familyName}
        currentFamilyUuid={familyId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },

  header: {
    backgroundColor: C.sageDark,
    paddingTop: 48, paddingBottom: 36,
    alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.white07, top: -60, right: -60,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.white20,
    borderWidth: 3, borderColor: C.white50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: 1 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  editBadge: { backgroundColor: C.white20, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  editBadgeText: { fontSize: 13, color: C.white80 },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nameInput: {
    backgroundColor: C.white20, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 18, fontWeight: '700', color: C.white, minWidth: 160,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 99, backgroundColor: C.sageLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnGray: { backgroundColor: C.white20 },
  iconBtnText: { fontSize: 15, fontWeight: '800', color: C.sageDark },
  emailText: { fontSize: 13, color: C.white65, fontWeight: '600', marginTop: 2 },

  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },

  card: {
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 16 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: C.stone, letterSpacing: 0.4, textTransform: 'uppercase' },
  rowValue: { fontSize: 15, fontWeight: '600', color: C.charcoal, marginTop: 1 },
  rowAction: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.sagePale },
  rowActionText: { fontSize: 12, fontWeight: '700', color: C.sageDark },
  divider: { height: 1, backgroundColor: C.dividerLight, marginLeft: 48 },

  footer: { padding: 16, paddingBottom: 32 },
  signOutBtn: {
    backgroundColor: C.white, borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5, borderColor: C.dividerRose,
    shadowColor: C.error, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  signOutBtnPressed: { backgroundColor: C.errorPale, borderColor: C.borderDanger },
  signOutText: { fontSize: 15, fontWeight: '800', color: C.error, letterSpacing: 0.2 },
});