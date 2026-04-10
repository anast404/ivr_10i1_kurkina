import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { TEditableUser } from '@/types';
import { getDocument, setDocument, updateDocument } from '@/utils/firebase-store';
import { useEffect, useRef, useState } from 'react';
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

const C = {
  sageDark:  '#4E7D62',
  sage:      '#7BAF8E',
  sageLight: '#B2D4BC',
  sagePale:  '#EEF7F1',
  cream:     '#FAF6EF',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  error:     '#D95B5B',
  errorPale: '#FDEAEA',
};

// ══════════════════════════════════════════════════════════════════════════════
// Модалка: Создать / Присоединиться к семье
// ══════════════════════════════════════════════════════════════════════════════
type FamilyTab = 'create' | 'join';

function FamilyModal({ visible, onClose, currentFamilyName, currentFamilyUuid, authUid, onSuccess }: {
  visible: boolean;
  onClose: () => void;
  currentFamilyName: string | null;
  currentFamilyUuid: string | null;
  authUid: string;
  onSuccess: () => void;
}) {
  const [tab, setTab]         = useState<FamilyTab>('create');
  const [nameVal, setNameVal] = useState('');
  const [uuidVal, setUuidVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setError]  = useState<string | null>(null);
  const [successMsg, setSucc] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const scale   = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
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
    if (!nameVal.trim()) { setError('Введите название семьи'); return; }
    setLoading(true); setError(null);
    try {
      const familyId = authUid; // используем uid как id семьи
      await setDocument('families', familyId, { name: nameVal.trim(), createdAt: new Date().toISOString(), ownerUid: authUid });
      await updateDocument('users', authUid, { family_uuid: familyId });
      setSucc('Семья создана! 🎉');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch {
      setError('Не удалось создать семью');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!uuidVal.trim()) { setError('Введите идентификатор'); return; }
    setLoading(true); setError(null);
    try {
      const doc = await getDocument('families', uuidVal.trim());
      if (!doc) throw new Error('not found');
      await updateDocument('users', authUid, { family_uuid: uuidVal.trim() });
      setSucc('Вы присоединились к семье! 🏡');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch {
      setError('Семья не найдена. Проверьте идентификатор.');
    } finally {
      setLoading(false);
    }
  };

  const shareText = async (text: string) => {
    try {
        await Share.share({
            message: text
        });
    } catch (error) {
        console.error('Error sharing:', error);
    }
  };

  // ── Если семья уже есть — показываем инфо ──
  if (currentFamilyName) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Pressable style={fm.backdrop} onPress={onClose}>
          <Animated.View style={[fm.sheet, { opacity, transform: [{ scale }] }]}>
            <Pressable onPress={() => {}}>
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
                      onPress={() => shareText(`Привет! Вот идентификатор нашей семьи в приложении: ${currentFamilyUuid}\n\nИспользуй его, чтобы присоединиться к нашей семье и начать совместное использование задач, заметок и событий!`)}
                    >
                      <Text style={fm.btnPrimaryText}>Поделиться</Text>
                    </Pressable>
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
      </Modal>
    );
  }

  // ── Нет семьи — создать или вступить ──
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={fm.backdrop} onPress={onClose}>
        <Animated.View style={[fm.sheet, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>
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
                  style={({ pressed }) => [fm.btnPrimary, loading && { opacity: 0.55 }, pressed && { opacity: 0.85 }]}
                  onPress={tab === 'create' ? handleCreate : handleJoin}
                  disabled={loading}
                >
                  <Text style={fm.btnPrimaryText}>
                    {loading ? '...' : tab === 'create' ? 'Создать' : 'Войти'}
                  </Text>
                </Pressable>
              </View>

            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const fm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(45,58,50,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  sheet: {
    width: '100%', backgroundColor: C.white, borderRadius: 28, overflow: 'hidden',
    shadowColor: '#2D3A32', shadowOffset: { width: 0, height: 12 },
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
    shadowColor: '#2D3A32', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: C.stone },
  tabTextActive: { color: C.sageDark, fontWeight: '800' },

  inputWrap: { width: '100%', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E0EBE4', borderRadius: 14,
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
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: '#E8E0D4',
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
  const { user: authUser, signOut } = useFirebaseAuth();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [familyName, setFamilyName]   = useState<string | null>(null);
  const [familyUuid, setFamilyUuid]   = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState('');
  const [familyModalVisible, setFamilyModalVisible] = useState(false);

  const loadUser = () => {
    getDocument('users', authUser.uid).then(async (value) => {
      setName(value?.name ?? '');
      setEmail(value?.email ?? '');
      if (value?.family_uuid) {
        const family = await getDocument('families', value.family_uuid);
        setFamilyName(family?.name ?? null);
        setFamilyUuid(value.family_uuid);
      } else {
        setFamilyName(null);
        setFamilyUuid(null);
      }
    });
  };

  useEffect(() => { loadUser(); }, []);

  const startEdit  = () => { setNameInput(name); setEditingName(true); };
  const cancelEdit = () => setEditingName(false);

  const saveName = async () => {
    if (nameInput.trim() && nameInput !== name) {
      const data: TEditableUser = { name: nameInput.trim() };
      await updateDocument('users', authUser.uid, data);
      loadUser();
    }
    setEditingName(false);
  };

  if (!authUser) return null;

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
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </Pressable>
      </View>

      {/* ── Модалка семьи ── */}
      <FamilyModal
        visible={familyModalVisible}
        onClose={() => setFamilyModalVisible(false)}
        currentFamilyName={familyName}
        currentFamilyUuid={familyUuid}
        authUid={authUser.uid}
        onSuccess={loadUser}
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
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: 1 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  editBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  editBadgeText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 18, fontWeight: '700', color: C.white, minWidth: 160,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 99, backgroundColor: C.sageLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnGray: { backgroundColor: 'rgba(255,255,255,0.2)' },
  iconBtnText: { fontSize: 15, fontWeight: '800', color: C.sageDark },
  emailText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 2 },

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
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 48 },

  footer: { padding: 16, paddingBottom: 32 },
  signOutBtn: {
    backgroundColor: C.white, borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F0E8E8',
    shadowColor: C.error, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  signOutBtnPressed: { backgroundColor: C.errorPale, borderColor: '#F5C6C6' },
  signOutText: { fontSize: 15, fontWeight: '800', color: C.error, letterSpacing: 0.2 },
});