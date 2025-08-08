import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MatchingConfig {
    skillMatchWeight: number;
    locationWeight: number;
    ratingWeight: number;
    minSkillLevel: 'beginner' | 'intermediate' | 'advanced';
    maxDistanceKm: number;
}

const DEFAULT_CONFIG: MatchingConfig = {
    skillMatchWeight: 0.5,
    locationWeight: 0.2,
    ratingWeight: 0.3,
    minSkillLevel: 'beginner',
    maxDistanceKm: 50,
};

const CONFIG_DOC_PATH = 'platformConfig/matching';

export async function getMatchingConfig(): Promise<MatchingConfig> {
    const ref = doc(db, CONFIG_DOC_PATH);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        return { ...DEFAULT_CONFIG, ...snap.data() } as MatchingConfig;
    }
    // If not set, initialize with default
    await setDoc(ref, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
}

export async function setMatchingConfig(config: MatchingConfig): Promise<void> {
    const ref = doc(db, CONFIG_DOC_PATH);
    await setDoc(ref, config);
}