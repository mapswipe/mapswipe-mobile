# Architecture of the code

The app is an [Expo](https://docs.expo.dev/) (SDK 56) React Native application
written in TypeScript, using [expo-router](https://docs.expo.dev/router/introduction/)
for navigation. It targets Android and iOS, and also builds for web (used mainly
for quick UI checks — the mapping screens have `.web.tsx` variants).

There is no hand-written native code. The `android/` and `ios/` directories are
**generated** by `expo prebuild` and are gitignored — see
[Native code](#native-code) below.

---

## Repository layout

| Path | What lives there |
| --- | --- |
| `app/` | Screens. File-based routes — the directory tree *is* the navigation structure. |
| `components/` | Shared presentational components and the per-project-type mapping sessions. |
| `hooks/` | Reusable hooks (`useAuth`, `useFirebaseDatabase`, `useTheme`, …). |
| `contexts/` | React contexts. Currently just `auth.ts`. |
| `utils/` | Non-React logic: Firebase/urql clients, tile maths, result shaping, types. |
| `constants/` | Theme tokens, dimensions, project-type lists, endpoint URLs. |
| `assets/`, `public/locales/` | Images, and translation files (one JSON per namespace per language). |
| `plugins/` | Expo [config plugins](https://docs.expo.dev/config-plugins/introduction/) — the only supported way to change native output. |
| `scripts/` | Build helpers (`copy-apk.ts`). |
| `generated/` | GraphQL codegen output. Gitignored, regenerate with `pnpm generate:type`. |
| `backend/`, `firebase/` | **Git submodules** (see below). |
| `docs/` | This documentation. |

### Git submodules

Two sibling repositories are vendored in as submodules:

- **`backend/`** — [mapswipe-backend](https://github.com/mapswipe/mapswipe-backend).
  The app consumes its `schema.graphql` for type generation, and its
  `project_types/` directory is the server-side counterpart to the mapping
  sessions in `components/`.
- **`firebase/`** — [mapswipe-firebase](https://github.com/mapswipe/mapswipe-firebase).
  Realtime Database rules, and the cloud functions behind
  [OSM login](osm-login.md). The app imports generated Firebase model types from
  it via the `@/firebaseGenerated/*` path alias.

Clone with `--recurse-submodules`, or run `git submodule update --init` after the
fact. CI checks out with `submodules: true`, and a missing `backend/schema.graphql`
will fail `pnpm generate:type` (and therefore `pnpm lint`).

---

## The two backends

This is the part that surprises people. MapSwipe talks to **two independent
backends**, and which one you reach for depends entirely on what you need.

### Firebase — everything to do with mapping

Accessed through the **Firebase JS SDK** (not `react-native-firebase`), set up in
[`utils/firebase.ts`](../utils/firebase.ts).

- **Firebase Auth** — the sole source of identity. Email/password, plus
  [OSM OAuth](osm-login.md) via `signInWithCustomToken`. On native, sessions
  persist through `AsyncStorage`.
- **Realtime Database** — projects, groups, tasks, submitted results, user
  profiles (`v2/users/{uid}`), announcements and the tutorial content.

Reads use [`useFirebaseDatabase`](../hooks/useFirebaseDatabase.ts), a thin
subscription wrapper over `onValue` returning `{ data, pending, error }`. It's a
*live* subscription — the component re-renders when the underlying data changes.
`useFirebaseDatabaseList` is the same thing for a list-shaped node.

Writes are always explicit. There is no store to mutate; you write to the
database directly and the subscription reflects it back.

### GraphQL — statistics only

A separate Django/GraphQL service (the community-dashboard backend), accessed
with [urql](https://commerce.nearform.com/open-source/urql/) from
[`utils/urqlClient.ts`](../utils/urqlClient.ts). It authenticates with **cookies
plus a CSRF token**, not the Firebase token — [`utils/csrfToken.ts`](../utils/csrfToken.ts)
fetches the token once at startup and `csrfFetch` attaches it to every request.

Its footprint is deliberately small — as of now, two queries:

- `UserStats` in [`app/(auth)/(home)/profile.tsx`](<../app/(auth)/(home)/profile.tsx>)
- `UserGroupStats` in [`app/(auth)/exploreGroup/[id]/index.tsx`](<../app/(auth)/exploreGroup/[id]/index.tsx>)

**Rule of thumb:** if it's a project, group, task or result, it's Firebase. If
it's an aggregate statistic or a leaderboard, it's GraphQL.

Types for GraphQL operations are generated, not written:

```sh
pnpm generate:type
```

This runs `graphql-codegen` against `EXPO_PUBLIC_GRAPHQL_CODEGEN_ENDPOINT`
(config in [`codegen.ts`](../codegen.ts)) and writes `generated/types/graphql.ts`.
It runs automatically before `pnpm lint` via the `prelint` script. The endpoint
can be a live URL or, as in CI, the local path `./backend/schema.graphql`.

---

## Navigation and auth

Routing is file-based. A file at `app/foo/bar.tsx` is the route `/foo/bar`;
`[id].tsx` is a dynamic segment; `(parens)` are layout groups that don't appear
in the URL. `typedRoutes` is enabled, so route strings are typechecked.

The auth boundary is enforced in the root layout,
[`app/_layout.tsx`](../app/_layout.tsx), using expo-router's `Stack.Protected`:

```
app/
  _layout.tsx            root: Firebase auth listener, urql + AuthContext providers
  index.tsx              entry — redirects based on auth/onboarding state
  languageSplashScreen   ┐
  onboarding             │ guard: NOT authenticated
  login/                 │  (login/osm.tsx is the OSM OAuth screen)
  register               │
  forgotPassword         ┘
  (auth)/                guard: authenticated
    (home)/              projects list, profile
    project/[id]/        project detail, tutorial, map/[taskGroupId]
    exploreGroup/[id]/   user group detail
    changeUsername
```

The root layout owns the whole session:

1. Subscribes to `firebaseAuth.onAuthStateChanged` → `user`.
2. Once a user exists, subscribes to `v2/users/{uid}` → `userDetails` (this is
   where `teamId` comes from). Fetched **once, here**, so screens read it from
   context rather than each refetching.
3. Fetches the CSRF token for the GraphQL client.
4. Holds the splash screen until auth resolves.

Components read all of this through [`useAuth()`](../hooks/useAuth.ts), which
returns a discriminated union — `authPending`, `isLoggedIn` and `user` narrow
together, so an `isLoggedIn: true` branch gives you a non-null `user` for free.

[`app/index.tsx`](../app/index.tsx) is the entry redirect: signed in → `/projects`;
otherwise language splash → onboarding → login, based on the
`@hasSelectedLanguage` / `@hasSeenOnboarding` AsyncStorage flags.

---

## Project types

A "project type" determines what the volunteer is shown and what a result looks
like. The numeric IDs come from the backend and are declared in
[`utils/types.ts`](../utils/types.ts):

| ID | Constant | Session component |
| --- | --- | --- |
| 1 | `PROJECT_TYPE_FIND` | `TileGridMappingSession` |
| 2 | `PROJECT_TYPE_VALIDATE` | `ValidateMappingSession` |
| 3 | `PROJECT_TYPE_COMPARE` | `CompareMappingSession` |
| 4 | `PROJECT_TYPE_COMPLETENESS` | `TileGridMappingSession` |
| 7 | `PROJECT_TYPE_STREET` | `StreetMappingSession` |
| 9 | `PROJECT_TYPE_LOCATE_FEATURES` | `LocateFeaturesMappingSession` |
| 10 | `PROJECT_TYPE_VALIDATE_IMAGE` | `ValidateImageMappingSession` |

Note that `SUPPORTED_PROJECT_TYPES` in
[`constants/common.ts`](../constants/common.ts) is a *narrower* list than the one
above — it gates which projects appear in the app. Street (7) has a session
component but is currently not listed, so those projects are filtered out of the
project list.

The single dispatch point is
[`app/(auth)/project/[id]/map/[taskGroupId].tsx`](<../app/(auth)/project/[id]/map/[taskGroupId].tsx>),
which switches on `projectDetails.projectType` and renders the matching session.

### Adding a new project type

This covers the app side only; the backend needs a matching entry under
`backend/project_types/` first, and the type must actually be emitted into the
Realtime Database.

1. **Declare the constant.** Add `PROJECT_TYPE_<NAME>` to
   [`utils/types.ts`](../utils/types.ts) with the numeric ID the backend uses,
   and add the corresponding project variant to the discriminated project union
   in the same file so `projectDetails` narrows correctly.
2. **List it as supported.** Add the constant to `SUPPORTED_PROJECT_TYPES` in
   [`constants/common.ts`](../constants/common.ts), or it won't be offered to
   users.
3. **Build the session component.** Add `components/<Name>MappingSession.tsx`.
   Start from the closest existing one — `TileGridMappingSession` for
   tile-grid-style swiping, `ValidateMappingSession` for one-feature-at-a-time.
   It receives the group's tasks and reports results upward.
4. **Wire up the dispatch.** Add the branch in `map/[taskGroupId].tsx`. Check the
   other conditionals in that file too — the instruction footer, result legend
   and completion behaviour are also switched on project type.
5. **Define the result options.** [`utils/results.ts`](../utils/results.ts) maps
   a project to its answer options. Tile-based types share `TILE_OPTIONS`;
   others read `customOptions` from the project with a fallback. Add whatever
   your type needs, and keep it consistent with the options rendered in the
   session component.
6. **Handle task data.** If the type needs a new task shape (different imagery
   source, geometry, tile maths), extend [`utils/task.ts`](../utils/task.ts).
7. **Add the tutorial path.** Project types ship a tutorial;
   [`utils/tutorial.ts`](../utils/tutorial.ts) and
   `app/(auth)/project/[id]/tutorial.tsx` need to know how to present yours.
8. **Add an icon and strings.** `components/ProjectTypeIcon.tsx`, plus new
   translation keys — see [translating.md](translating.md).

---

## Styling and theming

No styling library. Theme tokens are declared in
[`constants/theme.ts`](../constants/theme.ts) (`AppTheme`) and spacing/typography
scales in `constants/dimensions.ts`.

Components define styles as a factory taking the theme, and consume it with
`useThemedStyles`:

```tsx
const createStyles = (theme: AppTheme) => StyleSheet.create({
    label: { color: theme.textPrimary },
});

function MyComponent() {
    const styles = useThemedStyles(createStyles);
    // ...
}
```

Use `useSpacingToken` rather than hardcoding gaps, and prefer the shared layout
primitives (`BlockListView`, `InlineListView`, `Page`, `Text`) over raw `View`
and `Text` from react-native.

---

## Internationalisation

[`i18n.ts`](../i18n.ts) at the repo root configures `i18next` with a lazy
namespace loader; strings live in `public/locales/<lang>/<Namespace>.json` across
18 languages. Translation round-trips through Transifex. See
[translating.md](translating.md).

---

## Native code

`android/` and `ios/` are **build output**. `expo prebuild` regenerates them from
`app.config.js`, and `--clean` deletes them first. Anything you edit there is
lost.

To change native behaviour, write or extend a config plugin in
[`plugins/`](../plugins/). Two exist today, both good worked examples:

- `strip-unused-permissions.cjs` — removes Android permissions injected
  transitively by MapLibre and Expo's manifest template.
- `disable-liquid-glass.cjs` — patches `AppDelegate.swift` to opt out of the iOS
  26 glass navigation bar style.

Plugins are registered in the `plugins` array of `app.staging.json` /
`app.prod.json`.

### Environment configuration

`app.config.js` picks between `app.staging.json` and `app.prod.json` based on
`APP_ENV`:

| | staging (`APP_ENV=staging`) | production (default) |
| --- | --- | --- |
| Name | MapSwipe Dev | MapSwipe |
| URL scheme | `devmapswipe` | `mapswipe` |
| Android package | `org.missingmaps.mapswipe.dev` | `org.missingmaps.mapswipe` |
| iOS bundle ID | `org.missingmaps.mapswipe-dev` | `org.missingmaps.mapswipe` |

Runtime configuration — Firebase project, GraphQL endpoint, OSM auth URL — comes
from `EXPO_PUBLIC_*` environment variables, not from these files. See
[`.env.example`](../.env.example) and [develop-android.md](develop-android.md).

---

## See also

- [develop-android.md](develop-android.md) / [develop-ios.md](develop-ios.md) — getting set up
- [workflow.md](workflow.md) — how changes get merged and released
- [deployment.md](deployment.md) — cutting a release
- [osm-login.md](osm-login.md) — the OAuth flow in detail
