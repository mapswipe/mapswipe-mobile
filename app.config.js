/* eslint-env node */

const APP_ENV = process.env.APP_ENV ?? "development";

const configs = {
  development: require("./app.dev.json").expo,
  staging: require("./app.staging.json").expo,
  production: require("./app.prod.json").expo,
};

if (!(APP_ENV in configs)) {
  throw new Error(
    `Unknown APP_ENV: "${APP_ENV}". Expected one of: ${Object.keys(configs).join(", ")}`,
  );
}

module.exports = {
  expo: configs[APP_ENV],
};
