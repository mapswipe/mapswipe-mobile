# Translating MapSwipe

Here are some notes about translating MapSwipe. This is for the app only, other parts of the project (the website, mainly) are not covered by this document.

## If you're a translator

Go to www.transifex.com and sign up/login and request to join the MapSwipe team.

Details about translating are [on this page](https://github.com/mapswipe/mapswipe-mobile/wiki/Translating-MapSwipe).

---

## If you're a developer

Any text a user can see must be translatable. Hardcoded English strings are a
review blocker.

### How it's wired up

[`i18n.ts`](../i18n.ts) at the repo root configures
[`i18next`](https://www.i18next.com/) and
[`react-i18next`](https://react.i18next.com/):

- **Strings live in** `public/locales/<lang>/<Namespace>.json` — flat key/value
  JSON, one file per namespace. English is the source language.
- **Namespaces** are per-screen or per-feature (`login`, `signup`,
  `projectList`, `mappingSession`, `Tutorial`, …) — 37 of them today. They're
  loaded **lazily**, so a screen only pulls the JSON it needs.
- **The language** is detected by a custom detector that reads the `appLanguage`
  key from `AsyncStorage`, falling back to `en`. It's set by the language
  selection screen and persists until the app is uninstalled or its data cleared.
- **Fallback** is `en`, so a missing translation shows English rather than a raw
  key.

There is no Redux and no provider to wire up — `i18n.ts` is imported once in
[`app/_layout.tsx`](../app/_layout.tsx) and `useTranslation` works anywhere below
it.

### Using strings in a component

Pick the namespace when you call the hook:

```tsx
import { useTranslation } from 'react-i18next';

function ProfileHeader() {
    const { t } = useTranslation('profileScreen');

    return <Text>{t('yourContributions')}</Text>;
}
```

With interpolation — keep the placeholder name meaningful, translators see it:

```tsx
<Text>{t('welcomeToMapSwipe', { username })}</Text>
```

```json
{ "welcomeToMapSwipe": "Welcome to MapSwipe, {{username}}" }
```

When a string contains embedded markup or a tappable link, use `<Trans>` rather
than concatenating — splitting a sentence into fragments makes it untranslatable
in languages with a different word order:

```tsx
<Trans i18nKey="signup:IagreeToPrivacyNotice">
    I agree to the
    <Text style={styles.privacyLink} onPress={openPrivacy}>Privacy Notice</Text>
</Trans>
```

Note the `namespace:key` form — useful when you need a key from a namespace other
than the one you passed to `useTranslation`.

### Adding a new string

1. **Add the key to the English file only** — `public/locales/en/<Namespace>.json`.
   Never hand-edit the other languages; Transifex owns those.
2. **Use it** via `t('yourKey')`.
3. Key names are camelCase and describe the *meaning*, not the text
   (`usernameNotEmail`, not `yourUsernameCanNotBeAnEmail`). The text will change;
   the meaning usually won't.
4. Check the key really exists — a typo shows the raw key string in the UI, since
   `en` is also the fallback and silently returns the key when it's missing.

### Adding a new namespace

Two steps, and the second is easy to forget:

1. Create `public/locales/en/<Namespace>.json`.
2. **Register it in [`i18n.ts`](../i18n.ts)** — add an import line for the new
   namespace under **every** language block. The loader map is explicit (it has
   to be; Metro can't resolve fully dynamic imports), so an unregistered
   namespace rejects at runtime with `<lang>/<ns> not found`.

Prefer adding keys to an existing namespace where one fits.

### Committing translation changes

Put translation file changes in **their own commit**, separate from code:

```sh
git switch -c feat/my-feature develop
# ... code + public/locales/en/... changes
```

Transifex watches `public/locales/en/*.json` on `develop` (configured in
[`transifex.yaml`](../transifex.yaml)) and notifies translators once your PR
lands. Keeping the string changes in a distinct commit makes it obvious what was
sent for translation.

### Before a release

**Merge any open Transifex PRs before tagging a release.** Translations that land
after the tag miss the build entirely and wait for the next one. See
[workflow.md](workflow.md#cutting-a-production-release).

---

## Adding a new language

1. Add an entry to `supportedLanguages` in
   [`constants/common.ts`](../constants/common.ts) — `code` must match the
   directory name under `public/locales/`, `localeCode` is the BCP-47 tag, and
   `name` is the language's own name for itself (`Nederlands`, not `Dutch`).
   The list is ordered to match Wikipedia's language sidebar.
2. Add the language block to the `resources` map in [`i18n.ts`](../i18n.ts), with
   a loader for every namespace.
3. Create `public/locales/<code>/` with the namespace files. Transifex populates
   the content.
4. Verify it in the app's language selection screen — a language with missing
   namespace files will throw when a screen using one is opened.

---

## See also

- [workflow.md](workflow.md) — branching and release timing
- [architecture.md](architecture.md) — where i18n sits in the app
- [CONTRIBUTING.md](../CONTRIBUTING.md)
