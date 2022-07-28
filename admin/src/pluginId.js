const pluginPkg = require('../../package.json');

// const pluginId = pluginPkg.name.replace(/^(@[^-,.][\w,-]+\/|strapi-)(plugin|provider)-/i, '');
const pluginId = pluginPkg.strapi.name;

module.exports = pluginId;
