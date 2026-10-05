import { isFirebaseConfigured } from '../config/firebase';
import { firestoreAdapter } from './firestoreAdapter';
import { localAdapter } from './localAdapter';

/** Active storage adapter — Firestore when configured, otherwise localStorage demo mode. */
export const db = isFirebaseConfigured ? firestoreAdapter : localAdapter;

export const COLLECTIONS = ['dailyLogs', 'weightLogs', 'waterLogs', 'achievements'];
