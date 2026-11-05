import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const submit = () => {
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      Alert.alert('Almost there', 'Please complete all fields to continue.');
      return;
    }
    Alert.alert(
      mode === 'signup' ? 'Account ready to connect' : 'Login ready to connect',
      'Connect this screen to your authentication provider to finish the account flow.',
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText style={styles.backText}>‹ Back</ThemedText>
            </Pressable>
            <View style={styles.intro}>
              <ThemedText style={styles.eyebrow}>YOUR MEMORIES, WITH YOU</ThemedText>
              <ThemedText style={styles.title}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</ThemedText>
              <ThemedText style={styles.subtitle}>{mode === 'signup' ? 'Save your profiles and memories securely across devices.' : 'Log in to continue to your personal archive.'}</ThemedText>
            </View>
            <View style={styles.modeSwitch}>
              <Pressable onPress={() => setMode('signup')} style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Sign up</ThemedText></Pressable>
              <Pressable onPress={() => setMode('login')} style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}><ThemedText style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Log in</ThemedText></Pressable>
            </View>
            <View style={styles.formCard}>
              {mode === 'signup' && <View style={styles.field}><ThemedText style={styles.label}>NAME</ThemedText><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} autoCapitalize="words" style={styles.input} /></View>}
              <View style={styles.field}><ThemedText style={styles.label}>EMAIL</ThemedText><TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} /></View>
              <View style={styles.field}><ThemedText style={styles.label}>PASSWORD</ThemedText><TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} /></View>
              <Pressable onPress={submit} style={styles.submitButton}><ThemedText style={styles.submitText}>{mode === 'signup' ? 'Create account' : 'Log in'}</ThemedText></Pressable>
              <ThemedText style={styles.privacyText}>Your account will keep your profiles, notes, and albums together.</ThemedText>
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
  submitButton: { alignItems: 'center', backgroundColor: colors.moss, borderRadius: 10, paddingVertical: 14, marginTop: 4 },
  submitText: { color: '#fffdf8', fontSize: 15, fontWeight: '800' },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 16 },
});
