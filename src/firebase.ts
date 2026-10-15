import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let firestoreQuotaExceeded = false;

export function isFirestoreQuotaExceeded(): boolean {
  return firestoreQuotaExceeded;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const rawMsg = error instanceof Error ? error.message : String(error);

  // If quota limit is exceeded, catch gracefully and warn instead of crashing app
  if (
    rawMsg.includes('resource-exhausted') ||
    rawMsg.includes('Quota limit exceeded') ||
    rawMsg.includes('Quota exceeded')
  ) {
    firestoreQuotaExceeded = true;
    console.warn('Firestore write quota limit reached for today. Changes remain active in local session.', rawMsg);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on initial boot as required by skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
    }
  }
}

export const ADMIN_EMAIL = 'kof5842@gmail.com';

// Google Sign-In with Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Create/update user profile doc
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const isAdmin = user.email === ADMIN_EMAIL;
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: isAdmin ? 'admin' : 'user',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign-Out
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// Export Auth state listener
export { onAuthStateChanged };
export type { User };
