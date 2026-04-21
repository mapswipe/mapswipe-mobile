import Levels from '@/constants/level';

type LevelKey = keyof typeof Levels;

type LevelInfo = {
    level: number;
    levelData: (typeof Levels)[LevelKey];
    progress: { kmTillNextLevel: number; percentage: number };
    swipes: number;
    sqkm: string;
};

const levelKeys = (Object.keys(Levels).map(Number) as LevelKey[]).sort(
    (a, b) => (a as number) - (b as number),
);
const maxLevel = levelKeys[levelKeys.length - 1];
const minLevel = levelKeys[0];

const getLevelForContributionCount = (count: number): number => {
    for (let i = levelKeys.length - 1; i >= 0; i -= 1) {
        if (count >= Levels[levelKeys[i]].expRequired) {
            return Math.min(
                Math.max(levelKeys[i] as number, 1),
                maxLevel as number,
            );
        }
    }
    return minLevel as number;
};

const getProgress = (
    taskContributionCount: number,
    level: LevelKey,
): { kmTillNextLevel: number; percentage: number } => {
    if (level === maxLevel) {
        return { kmTillNextLevel: 0, percentage: 1 };
    }

    const nextLevelKey = (level + 1) as LevelKey;
    const currentLevelExp = Levels[level].expRequired;
    const nextLevelExp = Levels[nextLevelKey].expRequired;

    const expToGainTotal = nextLevelExp - currentLevelExp;
    const kmTillNextLevel = nextLevelExp - taskContributionCount;
    const percentage = 1 - kmTillNextLevel / expToGainTotal;

    return { kmTillNextLevel, percentage };
};

const getLevelInfo = (count: number): LevelInfo => {
    const level = getLevelForContributionCount(count);
    const levelData = Levels[level as LevelKey];
    const progress = getProgress(count, level as LevelKey);
    const swipes = Math.ceil(progress.kmTillNextLevel / 6);
    const sqkm = progress.kmTillNextLevel.toFixed(0);

    return {
        level,
        levelData,
        progress,
        swipes,
        sqkm,
    };
};

export default getLevelInfo;
