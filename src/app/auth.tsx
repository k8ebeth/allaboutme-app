import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const colors = {
  ink: '#26332e',
  muted: '#7d8881',
  paper: '#f7f5ef',
  card: '#fffdf8',
  line: '#e5e2d9',
  sage: '#dce8df',
  moss: '#3e6855',
  coral: '#d77f62',
};

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const submit = async () => {
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      Alert.alert('Almost there', 'Please complete all fields to continue.');
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert('Supabase is not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file, then restart Expo.');
      return;
    }

    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (result.error) {
      Alert.alert(mode === 'signup' ? 'Could not create account' : 'Could not log in', result.error.message);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      Alert.alert('Check your email', 'Supabase sent a confirmation link before your first login.');
      return;
    }
    router.replace('/');
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} keyboardShouldPersistTaps="handled">
            <View style={[styles.brandPanel, isWide && styles.brandPanelWide]}>
              <View style={styles.brandMark}>{['#d77f62', '#dce8df', '#4f7194', '#b18545', '#a16b86', '#3e6855', '#dce8df', '#d77f62', '#4f7194'].map((color, index) => <View key={index} style={[styles.markTile, { backgroundColor: color }]} />)}</View>
              <ThemedText style={styles.brandEyebrow}>THE LITTLE MOMENTS MATTER</ThemedText>
              <ThemedText style={styles.brandTitle}>all about me</ThemedText>
              <ThemedText style={styles.brandCopy}>A beautiful place to save your baby’s firsts, from the everyday wonders to the moments you never want to forget.</ThemedText>
              <View style={styles.brandRule} />
              <ThemedText style={styles.brandNote}>Photos, milestones, and memories for every growing day.</ThemedText>
            </View>
            <View style={[styles.authColumn, isWide && styles.authColumnWide]}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <ThemedText style={styles.backText}>‹ Back to calendar</ThemedText>
              </Pressable>
              <View style={styles.intro}>
                <ThemedText style={styles.eyebrow}>{mode === 'signup' ? 'BEGIN YOUR BABY DIARY' : 'WELCOME BACK, MAMA'}</ThemedText>
                <ThemedText style={styles.title}>{mode === 'signup' ? 'Keep every first close' : 'Continue your story'}</ThemedText>
                <ThemedText style={styles.subtitle}>{mode === 'signup' ? 'Create a private home for the tiny details, proud milestones, and photos that make this season yours.' : 'Log in to add the next little moment to your baby’s growing story.'}</ThemedText>
              </View>
              <View style={styles.modeSwitch}>
                <Pressable onPress={() => setMode('signup')} style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Sign up</ThemedText></Pressable>
                <Pressable onPress={() => setMode('login')} style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Log in</ThemedText></Pressable>
              </View>
              <View style={styles.formCard}>
                {mode === 'signup' && <View style={styles.field}><ThemedText style={styles.label}>NAME</ThemedText><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} autoCapitalize="words" style={styles.input} /></View>}
                <View style={styles.field}><ThemedText style={styles.label}>EMAIL</ThemedText><TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} /></View>
                <View style={styles.field}><ThemedText style={styles.label}>PASSWORD</ThemedText><TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} /></View>
                <Pressable onPress={submit} style={styles.submitButton}><ThemedText style={styles.submitText}>{mode === 'signup' ? 'Create account' : 'Log in'}</ThemedText><ThemedText style={styles.submitArrow}>→</ThemedText></Pressable>
                <ThemedText style={styles.privacyText}>Your private diary keeps notes, milestones, and photos together as your baby grows.</ThemedText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  safeArea: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48, maxWidth: 620, width: '100%', alignSelf: 'center' },
  contentWide: { flexDirection: 'row', alignItems: 'center', gap: 64, maxWidth: 1080, paddingHorizontal: 48, paddingVertical: 44 },
  brandPanel: { paddingVertical: 28, paddingHorizontal: 4 },
  brandPanelWide: { flex: 1, paddingHorizontal: 12, paddingVertical: 54 },
  brandMark: { width: 96, height: 96, flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 28 },
  markTile: { width: 28, height: 28, borderRadius: 8 },
  brandEyebrow: { color: colors.coral, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },
  brandTitle: { color: colors.ink, fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -1.5, marginTop: 10 },
  brandCopy: { color: colors.ink, fontSize: 18, lineHeight: 26, maxWidth: 360, marginTop: 16 },
  brandRule: { width: 42, height: 3, backgroundColor: colors.coral, marginTop: 30 },
  brandNote: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 12 },
  authColumn: { width: '100%' },
  authColumnWide: { flex: 1, maxWidth: 470 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: colors.moss, fontSize: 14, fontWeight: '800' },
  intro: { marginTop: 44, marginBottom: 28 },
  eyebrow: { color: colors.coral, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 420 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#eceae2', padding: 4, borderRadius: 12 },
  modeButton: { flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 11 },
  modeButtonActive: { backgroundColor: colors.card },
  modeText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: colors.ink },
  formCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 20, marginTop: 16 },
  field: { marginBottom: 18 },
  label: { color: colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, color: colors.ink, fontSize: 16, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: '#fbfaf5' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.moss, borderRadius: 10, paddingVertical: 14, marginTop: 4 },
  submitText: { color: '#fffdf8', fontSize: 15, fontWeight: '800' },
  submitArrow: { color: '#fffdf8', fontSize: 19, lineHeight: 19 },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 16 },
});
