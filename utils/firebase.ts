import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
    type FirebaseApp,
    initializeApp,
} from 'firebase/app';
import {
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from 'firebase/auth';
import {
    getDatabase,
    ref,
} from 'firebase/database';

// Optionally import the services that you want to use
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    // messagingSenderId: 'sender-id',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    // measurementId: 'G-measurement-id',
};

const getAuthForApp = (app: FirebaseApp) => {
    if (Platform.OS === 'web') {
        return getAuth(app);
    }
    return initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseDatabase = getDatabase(firebaseApp);
export const firebaseAuth = getAuthForApp(firebaseApp);

export function firebaseRef(path?: string) {
    return ref(firebaseDatabase, path);
}
