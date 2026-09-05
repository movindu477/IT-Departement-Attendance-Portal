import { doc, setDoc } from 'firebase/firestore';
import { supabase } from '../supabase';
import { db, auth } from '../firebase';
import { resizeToBlob } from './imageResize';

export async function uploadAvatar(file) {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not signed in');

  const blob = await resizeToBlob(file);
  const path = `${user.uid}/avatar.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new Error('Upload rejected — sign out and back in, then retry.');
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust: the storage path never changes, so browsers and the CDN would
  // otherwise keep serving the previous image after a replacement.
  const avatar = `${data.publicUrl}?v=${Date.now()}`;

  // setDoc/merge rather than updateDoc — AuthContext tolerates a missing
  // users/{uid} document, so it may genuinely not exist yet.
  await setDoc(doc(db, 'users', user.uid), { avatar }, { merge: true });
  return avatar;
}
