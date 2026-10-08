import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

// atob is available in browsers and in Hermes (React Native's JS engine).
const base64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// Lets the user pick a square photo and uploads it to {userId}/{name}-{time}.jpg in the public "photos" bucket.
// Returns the public URL, or null if the user cancelled.
export async function pickAndUploadPhoto(userId: string, name: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  const asset = result.assets[0];
  const type = asset.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  const path = `${userId}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('photos').upload(path, base64ToBytes(asset.base64!), { contentType: type });
  if (error) throw new Error(error.message);
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
