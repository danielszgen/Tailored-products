// Profile repository — single row with id PROFILE_ID ('me').
import type { Profile } from '@/domain/types';
import { db, PROFILE_ID, type LigaDB, type StoredProfile } from '../db';

export async function getProfile(database: LigaDB = db): Promise<StoredProfile | undefined> {
  return database.profile.get(PROFILE_ID);
}

/** Upsert: the profile always lives under id PROFILE_ID. */
export async function saveProfile(profile: Profile, database: LigaDB = db): Promise<void> {
  await database.profile.put({ ...profile, id: PROFILE_ID });
}

/** Shallow patch of the stored profile. Throws (Spanish message) when no profile exists yet. */
export async function updateProfile(patch: Partial<Profile>, database: LigaDB = db): Promise<void> {
  await database.transaction('rw', database.profile, async () => {
    const current = await database.profile.get(PROFILE_ID);
    if (!current) {
      throw new Error('Todavía no hay un perfil guardado. Completa el onboarding primero.');
    }
    await database.profile.put({ ...current, ...patch, id: PROFILE_ID });
  });
}
