import TabBar, { type TabBarItem } from '@/components/ui/TabBar';

// Untranslated: wiring these to mainHeader.json would change what 17 locales display.
const TABS: TabBarItem[] = [
    { name: 'projects', label: 'Projects', icon: 'map-pin' },
    { name: 'profile', label: 'Profile', icon: 'user' },
];

function HomeLayout() {
    return (
        <TabBar tabs={TABS} />
    );
}

export default HomeLayout;
