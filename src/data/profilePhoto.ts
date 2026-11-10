// Profile photo: picked from the photo library and copied into the app's own
// documents folder, so it stays on the phone when the picker's temp files are cleared.

import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Opens the photo library. Returns the stored photo's URI, or null if cancelled. */
export async function pickProfilePhoto(profileId: string, previous: string | null): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.length) return null;
  const picked = res.assets[0].uri;
  // Web has no app documents folder; the picked data URI is kept as is.
  if (Platform.OS === 'web') return picked;

  const ext = picked.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  // A new name each time, so the image cache never shows the old photo.
  const dest = new File(Paths.document, `avatar-${profileId}-${Date.now()}.${ext}`);
  await new File(picked).copy(dest);

  if (previous) {
    try {
      const old = new File(previous);
      if (old.exists) old.delete();
    } catch {
      // The old photo is already gone; nothing to clean up.
    }
  }
  return dest.uri;
}

/** Deletes a stored profile photo. On the web the photo lives in the database row, so there is no file. */
export function removeProfilePhoto(uri: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}
