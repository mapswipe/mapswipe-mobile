import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { update } from 'firebase/database';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Page from '@/components/Page';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
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

export default function ChangePassword() {
    const { user, setUser } = useAuth();
    const [newUserName, setNewUserName] = useState<string>('');
    const [usernameError, setUsernameError] = useState<string>();
    const router = useRouter();
    const { t } = useTranslation(['changeUserName', 'signup']);
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
            <Page
                title={t('changeUserName:changeUserName')}
                showBackButton
            >
                <BlockListView withPadding>
                    <Text>{t('changeUserName:osmUsernameChangeNotAllowed')}</Text>
                </BlockListView>
            </Page>
        );
    }

    return (
        <Page
            title={t('changeUserName:changeUserName')}
            showBackButton
        >
            <BlockListView
                withPadding
            >
                <TextInput
                    variant="normal"
                    labelText={t('changeUserName:currentUserName')}
                    value={user?.displayName ?? ''}
                    editable={false}
                />
                <TextInput
                    variant="normal"
                    labelText={t('changeUserName:newUserName')}
                    onChangeText={handleUsernameChange}
                    maxLength={MAX_USERNAME_LENGTH}
                    errorText={usernameError}
                    editable={!loading}
                />
                <Button
                    name="change-username"
                    title={loading
                        ? t('changeUserName:updatingUsername')
                        : t('changeUserName:confirmUserNameChange')}
                    disabled={
                        loading
                        || (newUserName?.length ?? 0) < MIN_USERNAME_LENGTH
                    }
                    onPress={handleUpdateProfile}
                />
            </BlockListView>
        </Page>
    );
}
