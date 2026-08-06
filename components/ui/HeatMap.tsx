import React from 'react';
import { WeeklyHeatMap } from '@symbiot.dev/react-native-heatmap';
import {
    endOfWeek,
    startOfWeek,
    subDays,
} from 'date-fns';

import Box from '@/components/ui/Box';
import useTheme from '@/hooks/useTheme';

// The library takes its cell size, gap, radius and colour ramp as props, not styles.
type HeatMapProps = {
    style?: never;
    activityData: Record<string, number>;
};

function normalizeActivityData(data: Record<string, number>) {
    const maxValue = Math.max(1, ...Object.values(data));
    const normalizedData: Record<string, number> = {};

    Object.entries(data).forEach(([date, value]) => {
        const ratio = value / maxValue;

        let level = 0;
        if (ratio <= 0) {
            level = 0;
        } else if (ratio < 0.25) {
            level = 1;
        } else if (ratio < 0.5) {
            level = 2;
        } else if (ratio < 0.75) {
            level = 3;
        } else {
            level = 4;
        }

        normalizedData[date] = level;
    });

    return normalizedData;
}

function HeatMap({ activityData }: HeatMapProps) {
    const theme = useTheme();
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const startDate = startOfWeek(thirtyDaysAgo, { weekStartsOn: 0 });
    const endDate = endOfWeek(today, { weekStartsOn: 0 });
    const normalizedData = normalizeActivityData(activityData);

    const heatMapTheme = {
        cellDefaultColor: theme.divider,
        cellColor: {
            1: theme.heatMapDayColor1,
            2: theme.heatMapDayColor2,
            3: theme.heatMapDayColor3,
            4: theme.heatMapDayColor4,
        },
        sidebarTextColor: theme.textPrimary,
        headerTextColor: theme.textPrimary,
    };
    return (
        <Box
            direction="row"
            grow={1}
        >
            <WeeklyHeatMap
                data={normalizedData}
                startDate={startDate}
                endDate={endDate}
                weekStartsOn={0}
                cellSize={35}
                theme={heatMapTheme}
                isHeaderVisible
                isSidebarVisible
                cellRadius={5}
                cellGap={5}
                scrollable={false}
            />
        </Box>
    );
}

export default HeatMap;
