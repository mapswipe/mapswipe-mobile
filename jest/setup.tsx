/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock only what cannot run under Node or what makes snapshots non-deterministic; anything
// affecting layout or style stays real.

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () => (
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));

// Keys, not translations: a copy edit must not churn every snapshot.
jest.mock('react-i18next', () => ({
    useTranslation: (ns?: string) => ({
        t: (key: string) => (ns ? `${ns}.${key}` : key),
        i18n: {
            language: 'en',
            changeLanguage: jest.fn(() => Promise.resolve()),
        },
    }),
    Trans: ({ i18nKey }: { i18nKey?: string }) => i18nKey ?? null,
    initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('@/utils/firebase', () => ({
    firebaseAuth: { currentUser: null, onAuthStateChanged: jest.fn(() => jest.fn()) },
    firebaseDatabase: {},
    firebaseApp: {},
}));

jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    getAuth: jest.fn(() => ({ currentUser: null })),
}));

// firebase/database ships ESM only, so jest cannot parse it. Reads never resolve, so
// data-driven branches render their empty state.
jest.mock('firebase/database', () => ({
    getDatabase: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    query: jest.fn(() => ({})),
    orderByChild: jest.fn(() => ({})),
    equalTo: jest.fn(() => ({})),
    limitToFirst: jest.fn(() => ({})),
    limitToLast: jest.fn(() => ({})),
    onValue: jest.fn(() => jest.fn()),
    get: jest.fn(() => Promise.resolve({ exists: () => false, val: () => null })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => ({ key: 'test-key' })),
}));

function mockNativeView(name: string) {
    const { View } = require('react-native');
    const Component = ({ children, ...props }: any) => (
        // The spread is the point: an unforwarded `style` would drop geometry from snapshots.
        // eslint-disable-next-line react/jsx-props-no-spreading
        <View {...props}>{children}</View>
    );
    Component.displayName = name;
    return Component;
}

// The shipped mock omits SafeAreaView, so re-add it as a plain View.
jest.mock('react-native-safe-area-context', () => {
    const { View } = require('react-native');
    return {
        ...require('react-native-safe-area-context/jest/mock').default,
        // eslint-disable-next-line react/jsx-props-no-spreading
        SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    };
});

jest.mock('react-native-webview', () => ({
    WebView: mockNativeView('WebView'),
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    MapView: mockNativeView('MapView'),
    Camera: mockNativeView('Camera'),
    ShapeSource: mockNativeView('ShapeSource'),
    RasterSource: mockNativeView('RasterSource'),
    RasterLayer: mockNativeView('RasterLayer'),
    LineLayer: mockNativeView('LineLayer'),
}));

jest.mock('@symbiot.dev/react-native-heatmap', () => ({
    WeeklyHeatMap: mockNativeView('WeeklyHeatMap'),
}));

// Reanimated's mock loads real internals, so worklets needs its shipped mock too, in this order.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Link stays real: ButtonLayout depends on expo-router's asChild prop forwarding.
jest.mock('expo-router', () => {
    const actual = jest.requireActual('expo-router');
    const { View } = require('react-native');
    const navigator = ({ children }: any) => <View>{children}</View>;
    navigator.Screen = () => null;
    return {
        ...actual,
        Stack: navigator,
        Tabs: navigator,
        useNavigation: () => ({
            setOptions: jest.fn(),
            goBack: jest.fn(),
            navigate: jest.fn(),
            addListener: jest.fn(() => jest.fn()),
            canGoBack: () => true,
        }),
        useFocusEffect: jest.fn(),
        useLocalSearchParams: () => ({}),
        useGlobalSearchParams: () => ({}),
        usePathname: () => '/',
        useRouter: () => ({
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            canGoBack: () => true,
            setParams: jest.fn(),
            dismissTo: jest.fn(),
        }),
        router: {
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            canGoBack: () => true,
        },
    };
});
