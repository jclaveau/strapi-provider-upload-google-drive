'use strict';

const pluginId = require('../../admin/src/pluginId')

class GoogleDriveController {
  getSettingsService () {
    return strapi
      .plugin(pluginId)
      .service('settings')
  }

  getService() {
    return strapi
      .plugin(pluginId)
      .service('drive')
  }

  async getServiceConfigured(validConfigurationRequired=true) {
    const driveSettings = await this.getSettingsService().get();
    const drive = this.getService()
    try {
      drive.initFromConfig(driveSettings)
    }
    catch (error) {
      if (validConfigurationRequired) {
        throw error
      }
    }
    return drive
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
      console.log('getAuthUrl authUrl', authUrl)
    }
    catch (error) {
      return ctx.badRequest(error.message);
    }

    const settings = await this.getSettingsService().get()

    settings.notValidated = {  // We will save them once Auth validated
      clientId: ctx.request.query.clientId,
      clientSecret: ctx.request.query.clientSecret,
    }

    // Required for redirect in watch mode (when API port differs from admin one due to proxy)
    settings.adminPort = ctx.request.header.origin?.split(':').pop()

    await this.getSettingsService().set(settings)

    return { authUrl }
  }

  async redeem (ctx) {

    const {
      code: googleApiAuthCode
    } = ctx.request.query;

    const settings = await this.getSettingsService().get()

    try {
      this.getService().getOAuth2Client(
        settings.notValidatedClientId,
        settings.notValidatedClientSecret,
      )

      const {
        // tokenInfo,
        tokens,
      } = await this.getService().redeemOAuth2Tokens(googleApiAuthCode)

      // Once the auth is ended (we have the token), we can save the client / secret
      settings.clientId     = settings.notValidated.clientId
      settings.clientSecret = settings.notValidated.clientSecret
      settings.notValidated = {}
      // settings.tokenInfo    = tokenInfo
      settings.tokens       = tokens

      await this.getSettingsService().set(settings)
    }
    catch (error) {
      throw new Error(error.message)
    }

    if (settings.adminPort) {
      // If in watch mode and behind a proxy, the /admin port will be set by Webpack and differ from the api one
      const currentDomain = ctx.request.header.host.split(':').shift()
      ctx.redirect(`//${currentDomain}:${settings.adminPort}/bo/admin/settings/${pluginId}`);
    }
    else {
      ctx.redirect(`/bo/admin/settings/${pluginId}`);
    }
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
    const drive = await this.getServiceConfigured(false)

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
};

module.exports = new GoogleDriveController()