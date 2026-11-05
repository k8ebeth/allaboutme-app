import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorPicker from 'react-native-wheel-color-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { setActiveProfileName } from '@/hooks/use-active-profile-name';
import { supabase } from '@/lib/supabase';

type ViewMode = 'month' | 'day' | 'year';
type DayEntry = { note: string; photos: string[] };
type Profile = { id: string; name: string; highlightColor: string; entries: Record<string, DayEntry> };

const colors = {
  ink: '#26332e', muted: '#7d8881', paper: '#f7f5ef', card: '#fffdf8', line: '#e5e2d9',
  sage: '#dce8df', moss: '#3e6855', coral: '#d77f62',
};
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PROFILES_KEY = 'allaboutme.profiles';
const highlightColors = ['#d77f62', '#3e6855', '#4f7194', '#a16b86', '#b18545'];

function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatSelectedDate(date: Date) { return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [mode, setMode] = useState<ViewMode>('month');
  const [profiles, setProfiles] = useState<Profile[]>([{ id: 'default', name: '', highlightColor: colors.coral, entries: {} }]);
  const [activeProfileId, setActiveProfileId] = useState('default');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState(highlightColors[0]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileColor, setEditProfileColor] = useState(highlightColors[0]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const selectedEntry = activeProfile.entries[dateKey(selectedDate)] ?? { note: '', photos: [] };
  const activeHighlightColor = activeProfile.highlightColor || colors.coral;
  const isSelectedToday = dateKey(selectedDate) === dateKey(today);

  useEffect(() => {
    AsyncStorage.getItem(PROFILES_KEY).then((savedProfiles) => {
      if (savedProfiles) {
        const parsedProfiles = (JSON.parse(savedProfiles) as Profile[]).map((profile) => ({ ...profile, highlightColor: profile.highlightColor || colors.coral }));
        if (parsedProfiles.length) {
          setProfiles(parsedProfiles);
          setActiveProfileId(parsedProfiles[0].id);
        }
      }
      setProfilesLoaded(true);
    }).catch(() => setProfilesLoaded(true));
  }, []);

  useEffect(() => {
    if (profilesLoaded) AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles, profilesLoaded]);

  useEffect(() => {
    setActiveProfileName(activeProfile.name);
  }, [activeProfile.name]);

  const updateActiveProfile = (update: (profile: Profile) => Profile) => {
    setProfiles((current) => current.map((profile) => profile.id === activeProfile.id ? update(profile) : profile));
  };
  const setProfileName = (name: string) => {
    updateActiveProfile((profile) => ({ ...profile, name }));
  };
  const addProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    const profile = { id: `${Date.now()}`, name, highlightColor: newProfileColor, entries: {} };
    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);
    setNewProfileName('');
    setNewProfileColor(highlightColors[0]);
    setProfileModalVisible(false);
  };
  const openEditProfile = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setEditProfileName(profile.name);
    setEditProfileColor(profile.highlightColor || colors.coral);
    setEditProfileModalVisible(true);
  };
  const saveProfileEdits = () => {
    if (!editingProfileId) return;
    setProfiles((current) => current.map((profile) => profile.id === editingProfileId ? { ...profile, name: editProfileName.trim(), highlightColor: editProfileColor } : profile));
    setEditProfileModalVisible(false);
  };
  const deleteProfile = () => {
    if (!editingProfileId) return;
    if (profiles.length === 1) {
      Alert.alert('Profile required', 'Keep at least one profile in your account.');
      return;
    }
    const profileToDelete = profiles.find((profile) => profile.id === editingProfileId);
    Alert.alert('Delete profile?', `Are you sure you want to delete ${profileToDelete?.name || 'this profile'}? Its notes and photos will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setProfiles((current) => current.filter((profile) => profile.id !== editingProfileId)); if (activeProfileId === editingProfileId) setActiveProfileId(profiles.find((profile) => profile.id !== editingProfileId)?.id || ''); setEditProfileModalVisible(false); } },
    ]);
  };
  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not log out', error.message);
  };
  const setNote = (note: string) => updateActiveProfile((profile) => ({ ...profile, entries: { ...profile.entries, [dateKey(selectedDate)]: { ...selectedEntry, note } } }));
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo access to add memories to this day.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.9 });
    if (!result.canceled) updateActiveProfile((profile) => ({ ...profile, entries: { ...profile.entries, [dateKey(selectedDate)]: { ...selectedEntry, photos: [...selectedEntry.photos, ...result.assets.map((asset) => asset.uri)] } } }));
  };
  const moveMonth = (amount: number) => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const selectDate = (date: Date) => { setSelectedDate(date); setViewDate(new Date(date.getFullYear(), date.getMonth(), 1)); setMode('day'); };
  const calendarDays: (number | null)[] = Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }, () => null);
  calendarDays.push(...Array.from({ length: daysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, index) => index + 1));

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><View style={styles.headerCopy}><ThemedText style={[styles.eyebrow, { color: activeHighlightColor }]}>ALL YOUR PRECIOUS MEMORIES</ThemedText><TextInput value={activeProfile.name} onChangeText={setProfileName} placeholder="Add name" placeholderTextColor={activeHighlightColor} style={[styles.titleInput, { color: activeHighlightColor }]} /></View><Pressable accessibilityLabel="Open profile settings" onPress={() => setSettingsVisible(true)} style={styles.avatar}><SymbolView tintColor={colors.moss} name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }} size={18} /></Pressable></View>
          <View style={styles.profileRow}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileList}>{profiles.map((profile) => <Pressable key={profile.id} onPress={() => setActiveProfileId(profile.id)} style={[styles.profileChip, profile.id === activeProfile.id && styles.profileChipActive, profile.id === activeProfile.id && { backgroundColor: profile.highlightColor || colors.coral, borderColor: profile.highlightColor || colors.coral }]}><ThemedText style={[styles.profileChipText, profile.id === activeProfile.id && styles.profileChipTextActive]}>{profile.name || 'Unnamed'}</ThemedText></Pressable>)}</ScrollView><Pressable onPress={() => setProfileModalVisible(true)} style={styles.newProfileButton}><ThemedText style={styles.newProfileText}>＋</ThemedText></Pressable></View>
          <Modal visible={profileModalVisible} transparent animationType="fade" onRequestClose={() => setProfileModalVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><ThemedText style={styles.modalTitle}>New profile</ThemedText><ThemedText style={styles.modalCaption}>Create a separate space for another person or chapter.</ThemedText><TextInput autoFocus value={newProfileName} onChangeText={setNewProfileName} placeholder="Profile name" placeholderTextColor={colors.muted} style={styles.profileInput} /><ThemedText style={styles.settingsLabel}>HIGHLIGHT COLOR</ThemedText><View style={styles.colorWheel}><ColorPicker color={newProfileColor} onColorChange={setNewProfileColor} thumbSize={28} sliderSize={20} noSnap row={false} /></View><View style={styles.modalActions}><Pressable onPress={() => setProfileModalVisible(false)} style={styles.cancelButton}><ThemedText style={styles.cancelText}>Cancel</ThemedText></Pressable><Pressable onPress={addProfile} style={styles.createButton}><ThemedText style={styles.createText}>Create</ThemedText></Pressable></View></View></View></Modal>
          <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}><View style={styles.modalBackdrop}><View style={styles.settingsCard}><View style={styles.settingsHeader}><View><ThemedText style={styles.modalTitle}>Profile settings</ThemedText><ThemedText style={styles.modalCaption}>Your memories stay separate for each profile.</ThemedText></View><Pressable accessibilityLabel="Close profile settings" onPress={() => setSettingsVisible(false)} style={styles.closeButton}><ThemedText style={styles.closeText}>×</ThemedText></Pressable></View><Pressable onPress={() => { setSettingsVisible(false); router.push('/auth'); }} style={styles.accountButton}><ThemedText style={styles.accountButtonText}>Sign up or log in</ThemedText><ThemedText style={styles.accountButtonArrow}>›</ThemedText></Pressable><ThemedText style={styles.settingsLabel}>PROFILE NAME</ThemedText><TextInput value={activeProfile.name} onChangeText={setProfileName} placeholder="Add name" placeholderTextColor={colors.muted} style={styles.profileInput} /><ThemedText style={styles.settingsLabel}>SWITCH PROFILE</ThemedText><View style={styles.settingsProfileList}>{profiles.map((profile) => <View key={profile.id} style={[styles.settingsProfileButton, profile.id === activeProfile.id && styles.settingsProfileButtonActive]}><Pressable onPress={() => setActiveProfileId(profile.id)} style={styles.profileSwitchButton}><ThemedText style={[styles.settingsProfileText, profile.id === activeProfile.id && styles.settingsProfileTextActive]}>{profile.name || 'Unnamed'}</ThemedText>{profile.id === activeProfile.id && <ThemedText style={styles.checkmark}>✓</ThemedText>}</Pressable><Pressable onPress={() => openEditProfile(profile)} style={styles.editProfileButton}><ThemedText style={styles.editProfileText}>Edit</ThemedText></Pressable></View>)}</View><View style={styles.settingsActions}><Pressable onPress={() => { setSettingsVisible(false); setProfileModalVisible(true); }} style={styles.addProfileAction}><ThemedText style={styles.addProfileActionText}>＋ Add profile</ThemedText></Pressable><Pressable onPress={() => setSettingsVisible(false)} style={styles.doneButton}><ThemedText style={styles.doneText}>Done</ThemedText></Pressable></View><Pressable onPress={logOut} style={styles.logoutButton}><ThemedText style={styles.logoutText}>Log out</ThemedText></Pressable></View></View></Modal>
          <Modal visible={editProfileModalVisible} transparent animationType="fade" onRequestClose={() => setEditProfileModalVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><ThemedText style={styles.modalTitle}>Edit profile</ThemedText><ThemedText style={styles.settingsLabel}>PROFILE NAME</ThemedText><TextInput autoFocus value={editProfileName} onChangeText={setEditProfileName} placeholder="Add name" placeholderTextColor={colors.muted} style={styles.profileInput} /><ThemedText style={styles.settingsLabel}>HIGHLIGHT COLOR</ThemedText><View style={styles.colorWheel}><ColorPicker color={editProfileColor} onColorChange={setEditProfileColor} thumbSize={28} sliderSize={20} noSnap row={false} /></View><Pressable onPress={deleteProfile} style={styles.deleteProfileButton}><ThemedText style={styles.deleteProfileText}>Delete profile</ThemedText></Pressable><View style={styles.modalActions}><Pressable onPress={() => setEditProfileModalVisible(false)} style={styles.cancelButton}><ThemedText style={styles.cancelText}>Cancel</ThemedText></Pressable><Pressable onPress={saveProfileEdits} style={styles.createButton}><ThemedText style={styles.createText}>Save changes</ThemedText></Pressable></View></View></View></Modal>
          <View style={styles.modeSwitch}>{(['month', 'day', 'year'] as ViewMode[]).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.modeButton, mode === item && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === item && styles.modeTextActive]}>{item[0].toUpperCase() + item.slice(1)}</ThemedText></Pressable>)}</View>
          {mode === 'year' ? <View style={styles.yearGrid}>{monthNames.map((name, month) => <Pressable key={name} onPress={() => { setViewDate(new Date(viewDate.getFullYear(), month, 1)); setMode('month'); }} style={styles.yearMonth}><ThemedText style={styles.yearMonthName}>{name}</ThemedText><ThemedText style={styles.yearMonthCount}>{month === today.getMonth() ? 'This month' : `${daysInMonth(viewDate.getFullYear(), month)} days`}</ThemedText><View style={styles.miniDays}>{Array.from({ length: 7 }, (_, index) => <View key={index} style={[styles.miniDot, index % 3 === 0 && styles.miniDotFilled]} />)}</View></Pressable>)}</View> : <>
            {mode === 'month' && <View style={styles.calendarCard}><View style={styles.calendarHeading}><Pressable onPress={() => moveMonth(-1)} style={styles.arrow}><ThemedText style={styles.arrowText}>‹</ThemedText></Pressable><View style={styles.monthTitle}><ThemedText style={styles.monthName}>{monthNames[viewDate.getMonth()]}</ThemedText><ThemedText style={styles.year}>{viewDate.getFullYear()}</ThemedText></View><Pressable onPress={() => moveMonth(1)} style={styles.arrow}><ThemedText style={styles.arrowText}>›</ThemedText></Pressable></View><View style={styles.weekRow}>{weekDays.map((day) => <ThemedText key={day} style={styles.weekDay}>{day}</ThemedText>)}</View><View style={styles.dateGrid}>{calendarDays.map((day, index) => { const date = day ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day) : null; const isSelected = date ? dateKey(date) === dateKey(selectedDate) : false; const hasEntry = date ? Boolean(activeProfile.entries[dateKey(date)]?.note || activeProfile.entries[dateKey(date)]?.photos.length) : false; return <Pressable key={`${day}-${index}`} disabled={!date} onPress={() => date && selectDate(date)} style={[styles.dateCell, isSelected && styles.dateCellSelected, isSelected && { backgroundColor: activeHighlightColor }]}><ThemedText style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>{day ?? ''}</ThemedText>{hasEntry && <View style={[styles.entryDot, { backgroundColor: isSelected ? '#fffdf8' : activeHighlightColor }]} />}</Pressable>; })}</View></View>}
            <View style={styles.dayHeader}><View><ThemedText style={styles.dayKicker}>SELECTED DAY</ThemedText><ThemedText style={styles.dayTitle}>{formatSelectedDate(selectedDate)}{isSelectedToday ? ' · Today' : ''}</ThemedText></View></View>
            <View style={styles.journalCard}><View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Notes</ThemedText><ThemedText style={styles.entryLabel}>{selectedEntry.note ? 'Saved' : 'Open page'}</ThemedText></View><TextInput value={selectedEntry.note} onChangeText={setNote} multiline placeholder="What happened today?" placeholderTextColor={colors.muted} style={styles.noteInput} /></View>
            <View style={styles.journalCard}><View style={styles.sectionHeader}><View><ThemedText style={styles.sectionTitle}>Photo album</ThemedText><ThemedText style={styles.sectionCaption}>{selectedEntry.photos.length ? `${selectedEntry.photos.length} memories` : 'Keep the moments that matter'}</ThemedText></View><Pressable onPress={choosePhoto} style={styles.addButton}><ThemedText style={styles.addButtonText}>＋ Add photo</ThemedText></Pressable></View>{selectedEntry.photos.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>{selectedEntry.photos.map((uri) => <View key={uri} style={styles.photoFrame}><Image source={{ uri }} contentFit="cover" style={styles.photoImage} /></View>)}</ScrollView> : <Pressable onPress={choosePhoto} style={styles.emptyAlbum}><ThemedText style={styles.cameraIcon}>◌</ThemedText><ThemedText style={styles.emptyTitle}>Add your first memory</ThemedText><ThemedText style={styles.emptyCopy}>Your photos stay grouped with this date.</ThemedText></Pressable>}</View>
          </>}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, safeArea: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52, maxWidth: 760, width: '100%', alignSelf: 'center', gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerCopy: { flex: 1 }, eyebrow: { color: colors.coral, fontSize: 11, letterSpacing: 1.8, fontWeight: '700' }, titleInput: { color: colors.ink, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1, padding: 0, marginTop: 2 }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.moss, fontWeight: '800', fontSize: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, profileList: { gap: 8 }, profileChip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 }, profileChipActive: { backgroundColor: colors.moss, borderColor: colors.moss }, profileChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, profileChipTextActive: { color: '#fffdf8' }, newProfileButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, newProfileText: { color: colors.moss, fontSize: 20, lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(38, 51, 46, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modalCard: { width: '100%', maxWidth: 420, backgroundColor: colors.card, borderRadius: 20, padding: 22 }, modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' }, modalCaption: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, profileInput: { borderBottomWidth: 1, borderBottomColor: colors.line, color: colors.ink, fontSize: 16, paddingVertical: 12, marginTop: 16 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 }, cancelButton: { paddingHorizontal: 13, paddingVertical: 10 }, cancelText: { color: colors.muted, fontWeight: '700' }, createButton: { backgroundColor: colors.moss, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10 }, createText: { color: '#fffdf8', fontWeight: '800' },
  settingsCard: { width: '100%', maxWidth: 520, backgroundColor: colors.card, borderRadius: 20, padding: 22 }, settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.moss, fontSize: 24, lineHeight: 25, fontWeight: '300' }, settingsLabel: { color: colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 22 }, settingsProfileList: { gap: 8, marginTop: 10 }, settingsProfileButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingLeft: 13, paddingRight: 9, paddingVertical: 6 }, profileSwitchButton: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingVertical: 6 }, editProfileButton: { paddingHorizontal: 8, paddingVertical: 7 }, editProfileText: { color: colors.moss, fontSize: 12, fontWeight: '800' }, settingsProfileButtonActive: { backgroundColor: colors.sage, borderColor: colors.sage }, settingsProfileText: { color: colors.ink, fontSize: 14, fontWeight: '700' }, settingsProfileTextActive: { color: colors.moss }, checkmark: { color: colors.moss, fontSize: 16, fontWeight: '800' }, settingsActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }, addProfileAction: { paddingVertical: 10 }, addProfileActionText: { color: colors.moss, fontSize: 13, fontWeight: '800' }, doneButton: { backgroundColor: colors.moss, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 10 }, doneText: { color: '#fffdf8', fontWeight: '800' }, deleteProfileButton: { marginTop: 22, paddingVertical: 8 }, deleteProfileText: { color: colors.coral, fontSize: 13, fontWeight: '800' },
  logoutButton: { borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center', marginTop: 16, paddingTop: 18 }, logoutText: { color: colors.coral, fontSize: 13, fontWeight: '800' },
  accountButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.sage, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, marginTop: 20 }, accountButtonText: { color: colors.moss, fontSize: 14, fontWeight: '800' }, accountButtonArrow: { color: colors.moss, fontSize: 24, lineHeight: 24 },
  colorPicker: { flexDirection: 'row', gap: 12, marginTop: 12 }, colorSwatch: { width: 30, height: 30, borderRadius: 15 }, colorSwatchSelected: { borderWidth: 3, borderColor: colors.ink, transform: [{ scale: 1.12 }] },
  colorWheel: { height: 270, marginTop: 16, marginBottom: 18 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#eceae2', padding: 4, borderRadius: 12 }, modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 }, modeButtonActive: { backgroundColor: colors.card, shadowColor: '#3c493f', shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 }, modeText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, modeTextActive: { color: colors.ink },
  calendarCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line }, calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, monthTitle: { alignItems: 'center' }, monthName: { color: colors.ink, fontSize: 22, fontWeight: '800' }, year: { color: colors.muted, fontSize: 12, marginTop: 2 }, arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: colors.moss, fontSize: 28, lineHeight: 28, fontWeight: '300' }, weekRow: { flexDirection: 'row', marginBottom: 8 }, weekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 10, fontWeight: '800' }, dateGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dateCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginBottom: 2 }, dateCellSelected: { backgroundColor: colors.moss }, dateNumber: { color: colors.ink, fontSize: 15, fontWeight: '600' }, dateNumberSelected: { color: '#fffdf8', fontWeight: '800' }, entryDot: { position: 'absolute', bottom: 7, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.coral },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }, dayKicker: { color: colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, dayTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 4 }, todayButton: { color: colors.moss, fontSize: 13, fontWeight: '800', paddingBottom: 3 }, journalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, sectionCaption: { color: colors.muted, fontSize: 12, marginTop: 4 }, entryLabel: { color: colors.coral, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, noteInput: { minHeight: 100, color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 14, textAlignVertical: 'top' }, addButton: { backgroundColor: colors.sage, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, addButtonText: { color: colors.moss, fontSize: 12, fontWeight: '800' }, emptyAlbum: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 24, marginTop: 16 }, cameraIcon: { color: colors.coral, fontSize: 30, lineHeight: 32 }, emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 8 }, emptyCopy: { color: colors.muted, fontSize: 12, marginTop: 4 }, photoRow: { gap: 10, paddingTop: 16 }, photoFrame: { width: 108, height: 108, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.sage }, photoImage: { width: '100%', height: '100%' }, photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dce8df' }, photoPlaceholderText: { color: colors.moss, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, yearMonth: { width: '31.5%', minHeight: 100, padding: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14 }, yearMonthName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, yearMonthCount: { color: colors.muted, fontSize: 11, marginTop: 5 }, miniDays: { flexDirection: 'row', gap: 4, marginTop: 16 }, miniDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line }, miniDotFilled: { backgroundColor: colors.coral },
});
