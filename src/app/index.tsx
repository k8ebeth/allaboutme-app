import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ViewMode = 'month' | 'day' | 'year';
type DayEntry = { note: string; photos: string[] };

const colors = {
  ink: '#26332e', muted: '#7d8881', paper: '#f7f5ef', card: '#fffdf8', line: '#e5e2d9',
  sage: '#dce8df', moss: '#3e6855', coral: '#d77f62',
};
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatSelectedDate(date: Date) { return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [mode, setMode] = useState<ViewMode>('month');
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const selectedEntry = entries[dateKey(selectedDate)] ?? { note: '', photos: [] };

  const setNote = (note: string) => setEntries((current) => ({ ...current, [dateKey(selectedDate)]: { ...selectedEntry, note } }));
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo access to add memories to this day.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.9 });
    if (!result.canceled) setEntries((current) => ({ ...current, [dateKey(selectedDate)]: { ...selectedEntry, photos: [...selectedEntry.photos, ...result.assets.map((asset) => asset.uri)] } }));
  };
  const moveMonth = (amount: number) => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const selectDate = (date: Date) => { setSelectedDate(date); setViewDate(new Date(date.getFullYear(), date.getMonth(), 1)); setMode('day'); };
  const calendarDays: (number | null)[] = Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }, () => null);
  calendarDays.push(...Array.from({ length: daysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, index) => index + 1));

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><View><ThemedText style={styles.eyebrow}>YOUR LITTLE ARCHIVE</ThemedText><ThemedText style={styles.title}>Daybook</ThemedText></View><View style={styles.avatar}><ThemedText style={styles.avatarText}>AM</ThemedText></View></View>
          <View style={styles.modeSwitch}>{(['month', 'day', 'year'] as ViewMode[]).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.modeButton, mode === item && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === item && styles.modeTextActive]}>{item[0].toUpperCase() + item.slice(1)}</ThemedText></Pressable>)}</View>
          {mode === 'year' ? <View style={styles.yearGrid}>{monthNames.map((name, month) => <Pressable key={name} onPress={() => { setViewDate(new Date(viewDate.getFullYear(), month, 1)); setMode('month'); }} style={styles.yearMonth}><ThemedText style={styles.yearMonthName}>{name}</ThemedText><ThemedText style={styles.yearMonthCount}>{month === today.getMonth() ? 'This month' : `${daysInMonth(viewDate.getFullYear(), month)} days`}</ThemedText><View style={styles.miniDays}>{Array.from({ length: 7 }, (_, index) => <View key={index} style={[styles.miniDot, index % 3 === 0 && styles.miniDotFilled]} />)}</View></Pressable>)}</View> : <>
            {mode === 'month' && <View style={styles.calendarCard}><View style={styles.calendarHeading}><Pressable onPress={() => moveMonth(-1)} style={styles.arrow}><ThemedText style={styles.arrowText}>‹</ThemedText></Pressable><View style={styles.monthTitle}><ThemedText style={styles.monthName}>{monthNames[viewDate.getMonth()]}</ThemedText><ThemedText style={styles.year}>{viewDate.getFullYear()}</ThemedText></View><Pressable onPress={() => moveMonth(1)} style={styles.arrow}><ThemedText style={styles.arrowText}>›</ThemedText></Pressable></View><View style={styles.weekRow}>{weekDays.map((day) => <ThemedText key={day} style={styles.weekDay}>{day}</ThemedText>)}</View><View style={styles.dateGrid}>{calendarDays.map((day, index) => { const date = day ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day) : null; const isSelected = date ? dateKey(date) === dateKey(selectedDate) : false; const hasEntry = date ? Boolean(entries[dateKey(date)]?.note || entries[dateKey(date)]?.photos.length) : false; return <Pressable key={`${day}-${index}`} disabled={!date} onPress={() => date && selectDate(date)} style={[styles.dateCell, isSelected && styles.dateCellSelected]}><ThemedText style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>{day ?? ''}</ThemedText>{hasEntry && <View style={styles.entryDot} />}</Pressable>; })}</View></View>}
            <View style={styles.dayHeader}><View><ThemedText style={styles.dayKicker}>SELECTED DAY</ThemedText><ThemedText style={styles.dayTitle}>{formatSelectedDate(selectedDate)}</ThemedText></View><Pressable onPress={() => setSelectedDate(today)}><ThemedText style={styles.todayButton}>Today</ThemedText></Pressable></View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.coral, fontSize: 11, letterSpacing: 1.8, fontWeight: '700' }, title: { color: colors.ink, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.moss, fontWeight: '800', fontSize: 12 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#eceae2', padding: 4, borderRadius: 12 }, modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 }, modeButtonActive: { backgroundColor: colors.card, shadowColor: '#3c493f', shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 }, modeText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, modeTextActive: { color: colors.ink },
  calendarCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line }, calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, monthTitle: { alignItems: 'center' }, monthName: { color: colors.ink, fontSize: 22, fontWeight: '800' }, year: { color: colors.muted, fontSize: 12, marginTop: 2 }, arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: colors.moss, fontSize: 28, lineHeight: 28, fontWeight: '300' }, weekRow: { flexDirection: 'row', marginBottom: 8 }, weekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 10, fontWeight: '800' }, dateGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dateCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginBottom: 2 }, dateCellSelected: { backgroundColor: colors.moss }, dateNumber: { color: colors.ink, fontSize: 15, fontWeight: '600' }, dateNumberSelected: { color: '#fffdf8', fontWeight: '800' }, entryDot: { position: 'absolute', bottom: 7, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.coral },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }, dayKicker: { color: colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, dayTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 4 }, todayButton: { color: colors.moss, fontSize: 13, fontWeight: '800', paddingBottom: 3 }, journalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, sectionCaption: { color: colors.muted, fontSize: 12, marginTop: 4 }, entryLabel: { color: colors.coral, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, noteInput: { minHeight: 100, color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 14, textAlignVertical: 'top' }, addButton: { backgroundColor: colors.sage, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, addButtonText: { color: colors.moss, fontSize: 12, fontWeight: '800' }, emptyAlbum: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 24, marginTop: 16 }, cameraIcon: { color: colors.coral, fontSize: 30, lineHeight: 32 }, emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 8 }, emptyCopy: { color: colors.muted, fontSize: 12, marginTop: 4 }, photoRow: { gap: 10, paddingTop: 16 }, photoFrame: { width: 108, height: 108, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.sage }, photoImage: { width: '100%', height: '100%' }, photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dce8df' }, photoPlaceholderText: { color: colors.moss, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, yearMonth: { width: '31.5%', minHeight: 100, padding: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14 }, yearMonthName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, yearMonthCount: { color: colors.muted, fontSize: 11, marginTop: 5 }, miniDays: { flexDirection: 'row', gap: 4, marginTop: 16 }, miniDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line }, miniDotFilled: { backgroundColor: colors.coral },
});
