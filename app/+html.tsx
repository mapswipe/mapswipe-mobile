import { ScrollViewStyleReset } from 'expo-router/html';

import WEB_ROOT_CSS from '@/constants/webRootCss';

export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/* Disables body scrolling on web so ScrollView behaves as it does on native. */}
                <ScrollViewStyleReset />

                {/* Raw CSS, so the background never flickers in dark mode. */}
                {/* eslint-disable-next-line react/no-danger */}
                <style dangerouslySetInnerHTML={{ __html: WEB_ROOT_CSS }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
