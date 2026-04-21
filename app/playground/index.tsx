import { ScrollView } from 'react-native';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import ButtonLayout from '@/components/ButtonLayout';

function Playground() {
    return (
        <ScrollView>
            <BlockListView
                withCenteredContent
                withPadding
            >
                Buttons
                <Button
                    name="here"
                    title="Click me"
                    colorVariant="primaryRed"
                    styleVariant="filled"
                />
            </BlockListView>
            <BlockListView
                withCenteredContent
                withPadding
            >
                Button Layouts
                <ButtonLayout
                    title="Click me"
                />
                <ButtonLayout
                    colorVariant="primaryRed"
                    styleVariant="outline"
                    title="primaryRed Outline"
                />
                <ButtonLayout
                    colorVariant="primaryRed"
                    styleVariant="filled"
                    title="primaryRed Filled"
                    iconName="add-outline"
                />
                <ButtonLayout
                    colorVariant="primaryRed"
                    styleVariant="transparent"
                    title="primaryRed Transparent"
                />
                <ButtonLayout
                    colorVariant="primaryRed"
                    styleVariant="block"
                    title="primaryRed Block"
                />
                <ButtonLayout
                    colorVariant="primaryBlue"
                    styleVariant="outline"
                    title="Primary Outline"
                />
                <ButtonLayout
                    colorVariant="primaryBlue"
                    styleVariant="filled"
                    title="Primary Filled"
                />
                <ButtonLayout
                    colorVariant="primaryBlue"
                    styleVariant="transparent"
                    title="Primary Transparent"
                />
                <ButtonLayout
                    colorVariant="primaryBlue"
                    styleVariant="block"
                    title="Primary Block"
                />
                <ButtonLayout
                    colorVariant="primaryGreen"
                    styleVariant="outline"
                    title="primaryGreen Outline"
                />
                <ButtonLayout
                    colorVariant="primaryGreen"
                    styleVariant="filled"
                    title="primaryGreen Filled"
                />
                <ButtonLayout
                    colorVariant="primaryGreen"
                    styleVariant="transparent"
                    title="primaryGreen Transparent"
                />
                <ButtonLayout
                    colorVariant="primaryGreen"
                    styleVariant="block"
                    title="primaryGreen Block"
                />
                <ButtonLayout
                    colorVariant="success"
                    styleVariant="outline"
                    title="success Outline"
                />
                <ButtonLayout
                    colorVariant="success"
                    styleVariant="filled"
                    title="success Filled"
                />
                <ButtonLayout
                    colorVariant="success"
                    styleVariant="transparent"
                    title="success Transparent"
                />
                <ButtonLayout
                    colorVariant="success"
                    styleVariant="block"
                    title="success Block"
                />
            </BlockListView>
        </ScrollView>
    );
}

export default Playground;
