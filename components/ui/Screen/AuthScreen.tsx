import { type ReactNode } from 'react';

import logo from '@/assets/images/icon.png';
import { AUTH_LOGO_INSET } from '@/constants/size';

import Box from '../Box';
import Media from '../Media';
import Stack from '../Stack';
import Screen from './index';

export interface AuthScreenProps {
    /** Announced but never drawn: the sign-in routes all run with `headerShown: false`. */
    title: string;

    /** Required, with no decorative opt-out: the logo is the only thing naming the app here. */
    logoAccessibilityLabel: string;

    /** Siblings of the outer column: a caller wanting tighter fields wraps them in a Stack. */
    children: ReactNode;

    /**
     * In flow at the end of the content, not Screen's `footer`: pinned to the viewport it would
     * sit over the form with the keyboard up.
     */
    footer?: ReactNode;

    testID?: string;
}

/**
 * The sign-in template: brand navy, the app mark under a band of empty space, one column
 * rhythm, links at the bottom. The four sign-in routes are this page with a different form.
 *
 * Two deliberate unifications: the logo band sits inside the scroller, so it can scroll away
 * under a keyboard, and keyboard avoidance is on for every caller.
 */
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
                {/* Box, not a centred Stack: one child, so a gap rung would be a value the
                    caller cannot see and the layout cannot use. */}
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
                {footer}
            </Stack>
        </Screen>
    );
}

export default AuthScreen;
