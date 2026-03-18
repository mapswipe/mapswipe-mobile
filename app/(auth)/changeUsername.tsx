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
import PageHeader from '@/components/PageHeader';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
import useAuth from '@/hooks/useAuth';
import useFirebaseMutation from '@/hooks/useFirebaseMutation';
import {
    MIN_USERNAME_LENGTH,
    usernameExists,
    validateUserName,
} from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';

const usernameErrorText = 'Username must be at least 4 characters long and cannot contain space and uppercase';
const usernameAlreadyExists = 'Username already exists';
const errorTitle = 'Failed to Change Username!';
const successTitle = 'Username updated successfully!';

export default function ChangePassword() {
    const { user, setUser } = useAuth();
    const [oldUsername, setOldUsername] = useState<string>('');
    const [newUserName, setNewUserName] = useState<string>('');
    const router = useRouter();
    const { t } = useTranslation('changeUserName');
    const { mutate, isLoading } = useFirebaseMutation();

    const handleUpdateProfile = useCallback(async () => {
        const isCurrentUsernameCorrect = user?.displayName === oldUsername;
        const isSame = newUserName === oldUsername;
        const isValid = validateUserName(newUserName) && !isSame && isCurrentUsernameCorrect;
        if (!isValid) {
            showAlert({
                title: errorTitle,
                message: usernameErrorText,
                alertType: 'error',
            });
            return;
        }
        const userNameAlreadyExist = await usernameExists(newUserName);
        if (userNameAlreadyExist) {
            showAlert({
                title: errorTitle,
                message: usernameAlreadyExists,
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
            return;
        }
        mutate(newUserName, async (name) => {
            if (!user) return;
            await updateProfile(user, { displayName: name as string });
            await update(firebaseRef(`users/${user.uid}`), { username: name });
            await user.reload();
            setUser({ ...user });
            setNewUserName('');
            setOldUsername('');
        }).then(() => {
            showAlert({
                title: 'Success',
                message: successTitle,
                alertType: 'success',
            });
            router.back();
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
        });
    }, [oldUsername, newUserName, user, setUser, mutate, router]);

    return (
        <Page title="Change Username">
            <PageHeader heading={t('changeUserName')} />
            <BlockListView
                withPadding
            >
                <TextInput
                    variant="normal"
                    labelText={t('currentUserName')}
                    value={oldUsername}
                    onChangeText={setOldUsername}
                />
                <TextInput
                    variant="normal"
                    labelText={t('newUserName')}
                    onChangeText={setNewUserName}
                    maxLength={128}
                    editable={!isLoading}
                />
                <Button
                    name="change-username"
                    title={isLoading
                        ? t('Updating Username')
                        : t('confirmUserNameChange')}
                    disabled={
                        isLoading
                        || (newUserName?.length ?? 0) < MIN_USERNAME_LENGTH
                    }
                    onPress={handleUpdateProfile}
                />
            </BlockListView>
        </Page>
    );
}
