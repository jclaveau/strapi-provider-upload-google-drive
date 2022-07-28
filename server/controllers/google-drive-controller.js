'use strict';

const pluginId = require('../../admin/src/pluginId')

class GoogleDriveController {
  getConfigService () {
    return strapi
      .plugin(pluginId)
      .service('config')
  }

  getService() {
    return strapi
      .plugin(pluginId)
      .service('drive')
  }

  async getServiceConfigured() {
    const driveConfig = await this.getConfigService().get();
    return this.getService().initFromConfig(driveConfig)
  }

  async index (ctx) {
    ctx.send({
      message: 'Google Drive Controller available'
    });
  }

  async getAuthUrl(ctx) {
    let authUrl
    try {
      this.getService().getOAuth2Client(
        ctx.request.query?.clientId,
        ctx.request.query?.clientSecret,
      )

      authUrl = this.getService().getAuthUrl()
    }
    catch (error) {
      return ctx.badRequest(error.message);
    }

    const config = await this.getConfigService().get()

    config.notValidated = {  // We will save them once Auth validated
      clientId: ctx.request.query.clientId,
      clientSecret: ctx.request.query.clientSecret,
    }

    // Required for redirect in watch mode
    config.adminPort = ctx.request.header.origin?.split(':').pop()

    await this.getConfigService().set(config)

    return { authUrl }
  }

  async redeem (ctx) {

    const {
      code: googleApiAuthCode
    } = ctx.request.query;

    const config = await this.getConfigService().get()

    try {
      this.getService().getOAuth2Client(
        config.notValidatedClientId,
        config.notValidatedClientSecret,
      )

      const {
        tokenInfo,
        tokens,
      } = await this.getService().redeemOAuth2Tokens(googleApiAuthCode)

      // Once the auth is ended (we have the token), we can save the client / secret
      config.clientId     = config.notValidated.clientId
      config.clientSecret = config.notValidated.clientSecret
      config.notValidated = {}

      config.tokenInfo    = tokenInfo
      config.tokens       = tokens

      await this.getConfigService().set(config)
    }
    catch (error) {
      throw new Error(error.message)
    }

    // If in watch mode and behind a proxy, the /admin port will be set by Webpack and differ from the api one
    const currentDomain = ctx.request.header.host.split(':').shift()
    const adminHost = currentDomain + (config.adminPort ? ':' + config.adminPort : '')
    ctx.redirect(`//${adminHost}/bo/admin/settings/${pluginId}`);
  }

  async file (ctx) {
    const drive = await this.getServiceConfigured()

    const [
      googleFileId, extension
    ] = ctx.params.filename.split('.')

    // return await drive.downloadFile(googleFileId, extension)
    const file = await drive.downloadFile(googleFileId, extension)

    ctx.type = file.headers['content-type']
    ctx.body = file.data
  }


  async parseFolderPath (ctx) {
    const query = ctx.request.query
    const drive = await this.getServiceConfigured()

    const defaultPattern = drive.getDefaultFolderPattern()
    const pattern = `${query.driveFolder}`.length ? query.driveFolder : defaultPattern

    const availableVariables = drive.getAvailableFolderVariables()
    for (var availableVariable in availableVariables) {
      if (typeof availableVariables[availableVariable] == 'function') {
        if (availableVariables[availableVariable].name == 'doResolvedAtUpload') {
          availableVariables[availableVariable] = 'Resolved during the upload'
        }
        else {
          throw new Error('Unhandled computed variable for drive folder')
        }
      }
    }

    return {
      defaultPattern,
      result: drive.getFolderPath(pattern),
      availableVariables,
      // env: process.env,
    }
  }

  async getFolderId (ctx) {
    // TODO delete this action
    const query = ctx.request.query
    const drive = await this.getServiceConfigured()

    // TODO replace parts based on file info
    const result = await drive.findPathId('/strapi/test')

    return {
      query,
      result,
    }
  }

};

module.exports = new GoogleDriveController()