/* eslint-env node */

const isStaging = process.env.APP_ENV === 'staging';

const stagingConfig = require('./app.staging.json').expo;
const prodConfig = require('./app.prod.json').expo;

const config = isStaging ? stagingConfig : prodConfig;

module.exports = {
  expo: config,
};
