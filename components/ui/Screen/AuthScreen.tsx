import { type ReactNode } from 'react';

import logo from '@/assets/images/icon.png';
import { AUTH_LOGO_INSET } from '@/constants/size';

import Box from '../Box';
import Media from '../Media';
import Stack from '../Stack';
import Screen from './index';

export interface AuthScreenProps {
    style?: never;
    /** Announced but never drawn: the sign-in routes run with `headerShown: false`. */
    title: string;

    logoAccessibilityLabel: string;

    children: ReactNode;

    /** In content flow, not Screen's `footer`, which the keyboard would sit under. */
    footer?: ReactNode;

    testID?: string;
}

function AuthScreen(props: AuthScreenProps) {
    const {
        title,
        logoAccessibilityLabel,
        children,
        footer,
        testID,
    } = props;

    return (
        <Screen
            title={title}
            colorVariant="brand"
            withKeyboardAvoidance
        >
            <Stack
                spacing="sm"
                padding="sm"
                testID={testID}
            >
                <Box
                    align="center"
                    paddingBlockStart={AUTH_LOGO_INSET}
                >
                    <Media
                        source={logo}
                        sizeVariant="lg"
                        accessibilityLabel={logoAccessibilityLabel}
                    />
                </Box>
                {children}
                {/* Its own gap: the links carry vertical padding of their own, so the body's
                    spacing on top of that reads as a gulf. */}
                <Stack
                    spacing="none"
                    align="center"
                >
                    {footer}
                </Stack>
            </Stack>
        </Screen>
    );
}

export default AuthScreen;
