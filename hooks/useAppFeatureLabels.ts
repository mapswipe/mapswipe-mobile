import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gql } from 'urql';

import { useAppFeaturesQuery } from '@/generated/types/graphql';

// NOTE: Cached so that the labels are available offline
const APP_FEATURE_LABELS_KEY = '@appFeatureLabels';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const APP_FEATURES = gql`
  query AppFeatures {
    enums {
      AppFeatureEnum {
        key
        label
      }
    }
  }
`;

// Labels of all the features defined in the backend.
// It also includes features added after this version of the app was released.
function useAppFeatureLabels(): Record<string, string> {
    const [cachedLabels, setCachedLabels] = useState<Record<string, string>>({});
    const [{ data }] = useAppFeaturesQuery();

    useEffect(() => {
        let mounted = true;
        AsyncStorage.getItem(APP_FEATURE_LABELS_KEY).then((value) => {
            if (mounted && value) {
                setCachedLabels(JSON.parse(value));
            }
        }).catch(() => {
            // NOTE: Labels fall back to the feature keys
        });
        return () => {
            mounted = false;
        };
    }, []);

    const fetchedLabels = useMemo(() => {
        const features = data?.enums.AppFeatureEnum;
        if (!features) {
            return undefined;
        }
        return Object.fromEntries(features.map((feature) => [feature.key, feature.label]));
    }, [data]);

    useEffect(() => {
        if (fetchedLabels) {
            AsyncStorage.setItem(APP_FEATURE_LABELS_KEY, JSON.stringify(fetchedLabels))
                .catch(() => {});
        }
    }, [fetchedLabels]);

    return fetchedLabels ?? cachedLabels;
}

export default useAppFeatureLabels;
