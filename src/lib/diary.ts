import { supabase } from './supabase';

export type DiaryEntry = { note: string; photos: string[] };
export type DiaryProfile = { id: string; name: string; highlightColor: string; entries: Record<string, DiaryEntry> };

type ProfileRow = { id: string; name: string; highlight_color: string };
type EntryRow = { id: string; entry_date: string; note: string; day_photos: { storage_path: string }[] };

function dateKeyToIso(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month, day).toISOString().slice(0, 10);
}

function isoToDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return `${year}-${month - 1}-${day}`;
}

async function signedPhotoUrl(path: string) {
  const { data, error } = await supabase.storage.from('day-photos').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function loadCloudProfiles(): Promise<DiaryProfile[]> {
  const { data: rows, error } = await supabase.from('profiles').select('id, name, highlight_color').order('created_at');
  if (error) throw error;

  return Promise.all((rows as ProfileRow[]).map(async (profile) => {
    const { data: entryRows, error: entryError } = await supabase
      .from('day_entries')
      .select('id, entry_date, note, day_photos(storage_path)')
      .eq('profile_id', profile.id)
      .order('entry_date');
    if (entryError) throw entryError;

    const entries = Object.fromEntries(await Promise.all((entryRows as EntryRow[]).map(async (entry) => [
      isoToDateKey(entry.entry_date),
      { note: entry.note, photos: await Promise.all(entry.day_photos.map((photo) => signedPhotoUrl(photo.storage_path))) },
    ])));

    return { id: profile.id, name: profile.name, highlightColor: profile.highlight_color, entries };
  }));
}

export async function saveCloudProfile(profile: DiaryProfile) {
  const { error } = await supabase.from('profiles').upsert({
    id: profile.id,
    name: profile.name,
    highlight_color: profile.highlightColor,
  });
  if (error) throw error;
}

export async function deleteCloudProfile(profileId: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw error;
}

export async function saveCloudEntry(profileId: string, key: string, entry: DiaryEntry) {
  const { data: savedEntry, error } = await supabase.from('day_entries').upsert({
    profile_id: profileId,
    entry_date: dateKeyToIso(key),
    note: entry.note,
  }, { onConflict: 'profile_id,entry_date' }).select('id').single();
  if (error) throw error;
  return savedEntry.id as string;
}

export async function uploadCloudPhoto(profileId: string, key: string, uri: string, note: string, contentType = 'image/jpeg') {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error('You must be logged in to upload a photo.');

  const entryId = await saveCloudEntry(profileId, key, { note, photos: [] });
  const blob = await fetch(uri).then((response) => response.blob());
  const path = `${userData.user.id}/${profileId}/${entryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error: uploadError } = await supabase.storage.from('day-photos').upload(path, blob, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { error: photoError } = await supabase.from('day_photos').insert({ entry_id: entryId, storage_path: path });
  if (photoError) throw photoError;
  return signedPhotoUrl(path);
}
