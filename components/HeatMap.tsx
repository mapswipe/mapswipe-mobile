import React from 'react';
import { WeeklyHeatMap } from '@symbiot.dev/react-native-heatmap';
import {
    endOfWeek,
    format,
    startOfWeek,
    subDays,
} from 'date-fns';

import useTheme from '@/hooks/useTheme';

import InlineListView from './InlineListView';

function HeatMap() {
    const theme = useTheme();
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const startDate = startOfWeek(thirtyDaysAgo, { weekStartsOn: 0 });
    const endDate = endOfWeek(today, { weekStartsOn: 0 });

    // Todo pass data from props
    const activityData: Record<string, number> = {};
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i <= 30; i++) {
        const date = subDays(today, i);
        const key = format(date, 'yyyy-MM-dd');
        // eslint-disable-next-line react-hooks/purity
        activityData[key] = Math.floor(Math.random() * 10);
    }

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
        <InlineListView>
            <WeeklyHeatMap
                data={activityData}
                startDate={startDate}
                endDate={endDate}
                weekStartsOn={0}
                scrollable
                cellSize={30}
                theme={heatMapTheme}
                isHeaderVisible
                isSidebarVisible
                cellRadius={5}
                cellGap={5}
            />
        </InlineListView>
    );
}

export default HeatMap;
