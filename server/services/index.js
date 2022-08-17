'use strict';

const config    = require('./config-service');
const settings  = require('./settings-service');
const drive     = require('./drive-service');

module.exports = {
  config,
  settings,
  drive,
};
