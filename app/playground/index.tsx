import Button from '@/components/ui/Button';
import ButtonLayout from '@/components/ui/ButtonLayout';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import { type ColorVariant } from '@/constants/theme';

/**
 * The component playground: every colour role against every button look.
 *
 * The matrix is generated from the unions rather than written out, so a role or a style added to
 * the design system shows up here without anyone remembering to add it. Dev-only, and its copy is
 * hardcoded English on purpose: it names variants, not user-facing strings.
 */
const COLOR_VARIANTS: ColorVariant[] = [
    'default', 'secondary', 'muted', 'brand', 'onBrand', 'onImage', 'surface',
    'sunken', 'accent', 'positive', 'notice', 'negative', 'informative',
];

// `underline` is excluded: it takes neither a padding nor a width, so it is not part of the
// box matrix and gets its own row below.
const BOX_STYLE_VARIANTS = ['filled', 'outline', 'transparent'] as const;

function noop() {}

function Playground() {
    return (
        <Screen
            title="Playground"
            padding="xs"
            spacing="md"
        >
            <Section title="Button">
                <Button
                    name="playground-button"
                    title="Click me"
                    accessibilityLabel="Click me"
                    colorVariant="negative"
                    styleVariant="filled"
                    onPress={noop}
                />
            </Section>

            {BOX_STYLE_VARIANTS.map((styleVariant) => (
                <Section
                    key={styleVariant}
                    title={`ButtonLayout / ${styleVariant}`}
                >
                    {COLOR_VARIANTS.map((colorVariant) => (
                        <ButtonLayout
                            key={colorVariant}
                            title={`${colorVariant} ${styleVariant}`}
                            accessibilityLabel={`${colorVariant} ${styleVariant}`}
                            colorVariant={colorVariant}
                            styleVariant={styleVariant}
                        />
                    ))}
                </Section>
            ))}

            <Section title="ButtonLayout / with a glyph">
                <ButtonLayout
                    title="filled with an icon"
                    accessibilityLabel="filled with an icon"
                    colorVariant="brand"
                    styleVariant="filled"
                    iconName="add-outline"
                />
            </Section>

            <Section title="ButtonLayout / underline">
                {COLOR_VARIANTS.map((colorVariant) => (
                    <ButtonLayout
                        key={colorVariant}
                        title={`${colorVariant} underline`}
                        accessibilityLabel={`${colorVariant} underline`}
                        colorVariant={colorVariant}
                        styleVariant="underline"
                    />
                ))}
            </Section>

            <Section title="ButtonLayout / states">
                {(['default', 'disabled', 'pending'] as const).map((state) => (
                    <ButtonLayout
                        key={state}
                        title={state}
                        accessibilityLabel={state}
                        colorVariant="brand"
                        styleVariant="filled"
                        state={state}
                    />
                ))}
            </Section>
        </Screen>
    );
}

export default Playground;
