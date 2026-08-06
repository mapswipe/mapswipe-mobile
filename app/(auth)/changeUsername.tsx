import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { update } from 'firebase/database';

import { showAlert } from '@/components/Toast';
import Button from '@/components/ui/Button';
import { type ButtonStateType } from '@/components/ui/ButtonLayout';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import TextInput from '@/components/ui/TextInput';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import useAuth from '@/hooks/useAuth';
import {
    MAX_USERNAME_LENGTH,
    MIN_USERNAME_LENGTH,
    usernameExists,
    validateUserName,
} from '@/utils/common';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';

const usernameSameAsBefore = 'New username is same as old!';

/**
 * 'pending' rather than 'disabled': only the pending state makes the button announce itself as
 * busy.
 */
function resolveSubmitState(pending: boolean, tooShort: boolean): ButtonStateType {
    if (pending) {
        return 'pending';
    }

    if (tooShort) {
        return 'disabled';
    }

    return 'default';
}

export default function ChangePassword() {
    const { user, setUser } = useAuth();
    const [newUserName, setNewUserName] = useState<string>('');
    const [usernameError, setUsernameError] = useState<string>();
    const router = useRouter();
    const { t } = useTranslation(['changeUserName', 'signup']);
    // The back button's label belongs to the navigation bar, not to this screen's copy, and no
    // shared namespace holds one, so it is borrowed from where the string already exists.
    const { t: tChrome } = useTranslation('mappingSession');
    // FIXME: Update the use of this function
    const {
        handleAsync,
        loading,
    } = useAsyncHandler();

    const handleUsernameChange = useCallback((value: string) => {
        setNewUserName(value);
        setUsernameError(
            value.length > 0 && !validateUserName(value)
                ? t('signup:usernameErrorText')
                : undefined,
        );
    }, [t]);

    const handleUpdateProfile = useCallback(async () => {
        const isSame = newUserName === user?.displayName;
        const isValid = validateUserName(newUserName) && !isSame;
        handleAsync(async () => {
            if (isSame) {
                showAlert({
                    title: t('changeUserName:errorOnUsernameChange'),
                    message: usernameSameAsBefore,
                    alertType: 'error',
                });
                return;
            }
            if (!isValid) {
                showAlert({
                    title: t('changeUserName:errorOnUsernameChange'),
                    message: t('signup:usernameError'),
                    alertType: 'error',
                });
                return;
            }
            const userNameAlreadyExist = await usernameExists(newUserName);

            if (userNameAlreadyExist) {
                showAlert({
                    title: t('changeUserName:errorOnUsernameChange'),
                    message: t('signup:userNameExistError'),
                    alertType: 'error',
                    shouldHideAfterDelay: false,
                });
                return;
            }
            if (!user) return;

            await updateProfile(
                user,
                { displayName: newUserName as string },
            );
            await update(
                firebaseRef(`v2/users/${user.uid}`),
                {
                    username: newUserName,
                    usernameKey: newUserName.toLowerCase(),
                },
            );
            await user.reload();
            showAlert({
                title: t('signup:success'),
                message: t('changeUserName:usernameUpdated'),
                alertType: 'success',
            });
            router.back();
            setUser(firebaseAuth.currentUser);
            setNewUserName('');
        }).catch((err) => {
            const message = err instanceof Error ? err.message : 'Unknown error occurred';
            showAlert({
                title: t('changeUserName:errorOnUsernameChange'),
                message,
                alertType: 'error',
            });
        });
    }, [newUserName, user, setUser, handleAsync, router, t]);

    if (user?.uid?.startsWith('osm:')) {
        return (
            <Screen
                title={t('changeUserName:changeUserName')}
                withHeader
                backAccessibilityLabel={tChrome('goBack')}
                safeArea="bottom"
                padding="md"
                spacing="md"
            >
                <Text>{t('changeUserName:osmUsernameChangeNotAllowed')}</Text>
            </Screen>
        );
    }

    // One string for the label and the announced name, as the old button derived the second
    // from the first.
    const submitLabel = loading
        ? t('changeUserName:updatingUsername')
        : t('changeUserName:confirmUserNameChange');

    return (
        <Screen
            title={t('changeUserName:changeUserName')}
            withHeader
            backAccessibilityLabel={tChrome('goBack')}
            safeArea="bottom"
            padding="md"
            spacing="md"
        >
            <TextInput
                colorVariant="sunken"
                labelText={t('changeUserName:currentUserName')}
                value={user?.displayName ?? ''}
                stateVariant="readOnly"
            />
            <TextInput
                colorVariant="sunken"
                contentVariant="username"
                labelText={t('changeUserName:newUserName')}
                onChangeText={handleUsernameChange}
                maxLength={MAX_USERNAME_LENGTH}
                errorText={usernameError}
                stateVariant={loading ? 'disabled' : 'editable'}
            />
            <Button
                name="change-username"
                title={submitLabel}
                accessibilityLabel={submitLabel}
                state={resolveSubmitState(
                    loading,
                    (newUserName?.length ?? 0) < MIN_USERNAME_LENGTH,
                )}
                onPress={handleUpdateProfile}
            />
        </Screen>
    );
}
