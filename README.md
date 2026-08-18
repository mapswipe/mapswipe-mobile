# MapSwipe

Welcome to the MapSwipe app. This is the app that is distributed through [mapswipe.org](http://mapswipe.org) as well as through the Google Play and Apple stores. It was initially developed by Doctors without Borders as part of the Missing Maps project.

## Main Overview

In a nutshell, here is how MapSwipe works:

1. Humanitarian organisations set the parameters for projects through a web-based admin interface.
1. Our backend workers process those projects and place them on Firebase. It imports them into groups that are safe for the user to cache locally on their phone (ideally 200 tiles). This [image](http://i.imgur.com/giQq43i.jpg "image of grouping") shows an example of how that grouping algorithm works.
1. The app fetches the projects from the /projects reference in Firebase through the JavaScript SDK (don't use http requests to Firebase) and displays them to the user.
1. The user searches those tiles and classifies them. The results are then synced back to Firebase.
1. When a user chooses to map an area, he or she is distributed groups of the project. On completion, the user then gets badges for the distance they've mapped.

:)

## Project Diagram

The following is an outline of how data typically flows and makes it into the mobile application. Most of the action happens in one of the three areas, namely the **backend scripts**, **Firebase database**, and **clients**. 

![Main overview](http://i.imgur.com/PYT62JF.png)

This application encompasses only the mobile Android & iOS clients. The role of the clients are to retrieve project information (metadata and tile information) so that volunteers can swipe through and tag them. Then, this tagging information is synchronized back to Firebase. The backend scripts (in a [separate repository](https://github.com/mapswipe/python-mapswipe-workers)) are responsible for populating and processing the project information in Firebase.

## Developing, Building, and Contributing to MapSwipe

If you'd like to modify and improve MapSwipe, read through the following to get familiar with the project. Please also read [CONTRIBUTING](CONTRIBUTING.md).

### Documentation

| Doc | What it covers |
| --- | --- |
| [architecture.md](docs/architecture.md) | How the code is organised: the two backends, routing and auth, project types, theming |
| [develop-android.md](docs/develop-android.md) | Setting up an Android development environment |
| [develop-ios.md](docs/develop-ios.md) | Setting up an iOS development environment, and release code signing |
| [workflow.md](docs/workflow.md) | Branching, PRs, reviews and release cadence |
| [deployment.md](docs/deployment.md) | Cutting a release with `deploy.sh` |
| [dev-release.md](docs/dev-release.md) | Building a release-mode APK locally |
| [translating.md](docs/translating.md) | Adding user-facing text, and how translation works |
| [osm-login.md](docs/osm-login.md) | The OpenStreetMap OAuth login flow |
| [upgrading-dependencies.md](docs/upgrading-dependencies.md) | Dependency and Expo SDK upgrades |
| [privacy.md](docs/privacy.md) | Privacy policy |

New here? Start with [architecture.md](docs/architecture.md), then the setup page for your platform.

## Technology Used

1. The app is written entirely in [React Native](https://facebook.github.io/react-native/docs/getting-started.html)
1. Firebase provides the backend database. It is protected with security rules so that users and contributors to this open source project can not cause damage.
1. The [workers](https://github.com/mapswipe/python-mapswipe-workers) on the backend are running on Google Cloud and handle pre-processing and post-processing the data.

## State of the project

The app was rebuilt at the start of 2026 on a recent version of react-native, and expanded to support multiple types of tasks, as well as a variety of languages.
