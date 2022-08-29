const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { google } = require('googleapis');
const PProgress = require('p-progress');

// https://developers.google.com/drive/api/guides/about-sdk
// https://developers.google.com/workspace/guides/enable-apis

const pluginId = require('../../admin/src/pluginId')

// https://developers.google.com/identity/protocols/oauth2/scopes#drive
const GOOGLE_AUTH_SCOPES            = 'https://www.googleapis.com/auth/drive.file';
const DEFAULT_DRIVE_FOLDER_PATTERN  = '/Strapi Uploads/{{ package.name }}/{{ env }}/{{ file.type }}/';


module.exports = {
  initFromConfig(config) {

    this.config = config

    this.getOAuth2Client(
      config.clientId,
      config.clientSecret,
    )

    this.oAuth2Client.setCredentials(config.tokens);

    this.drive = google.drive({
      version: 'v3',
      auth: this.oAuth2Client
    });

    return this
  },

  getConfig() {
    if (this.config == null) {
      throw new Error('Google Drive Service must be initialized with initFromConfig(config) first')
    }
    return this.config
  },

  getOAuth2Client(clientId, clientSecret) {
    if (this.oAuth2Client != null) {
      return this.oAuth2Client;
    }

    if (! clientId.match(/^.+$/)) {
      throw new Error(`Invalid Google Drive OAuth Client Id: ${JSON.stringify(clientId)}`)
    }

    if (! clientSecret.match(/^.+$/)) {
      throw new Error(`Invalid Google Drive OAuth Client Secret: ${JSON.stringify(clientSecret)}`)
    }

    this.oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${strapi.config.server.url}/${pluginId}/google-auth-redirect-uri`
    );

    return this.oAuth2Client;
  },

  getAuthUrl(adminPort=null) {
    if (this.oAuth2Client == null) {
      throw new Error('oAuth2Client missing. Please call getOAuth2Client() first')
    }

    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_AUTH_SCOPES,
    });

    return authUrl
  },

  async redeemOAuth2Tokens(code) {

    if (this.oAuth2Client == null) {
      throw new Error('oAuth2Client missing. Please call getOAuth2Client() first')
    }

    const response = await this.oAuth2Client.getToken(code);

    if (! response.tokens) {
      throw new Error('No token retrieved from oAuth2Client.getToken(code)')
    }

    const tokens = response.tokens

    const tokenInfo = await this.oAuth2Client.getTokenInfo(tokens.access_token); // Useful?

    this.oAuth2Client.setCredentials(tokens);

    return {
      tokenInfo,
      tokens : response?.tokens,
    }
  },

  getDefaultFolderPattern() {
    return DEFAULT_DRIVE_FOLDER_PATTERN
  },

  getFolderPattern() {
    return this.getConfig().driveFolderPattern && this.getConfig().driveFolderPattern.length
      ? this.getConfig().driveFolderPattern
      : this.getDefaultFolderPattern()
  },

  getAvailableFolderVariables() {
    // TODO get variables from the provider config?

    const resolveAtUpload = (customizer) => {
      // Naming this function is required!
      const doResolvedAtUpload = function(variableName, values=null) {
        return customizer(variableName, values)
      }

      return doResolvedAtUpload
    }

    return {
      // TODO retrieve those from strapi.config instead of process.env
      'env': process.env['NODE_ENV'],
      'package.name': process.env['npm_package_name'],
      'package.version': process.env['npm_package_version'],
      'package.description': process.env['npm_package_description'],
      'package.author_name': process.env['npm_package_author_name'],
      'package.strapi_uuid': process.env['npm_package_strapi_uuid'],
      'package.folder': process.env['INIT_CWD'].split('/').pop(),
      'file.name': resolveAtUpload((variableName, values=null) => {
        return values.file.name
      }),
      'file.mime': resolveAtUpload((variableName, values=null) => {
        return values.file.mime
      }),
      'file.type': resolveAtUpload((variableName, values=null) => {
        return values.file.mime.split('/')[0]
      }),
      'file.ext': resolveAtUpload((variableName, values=null) => {
        return values.file.ext.split('.').pop()
      }),
    }
  },

  getFolderPath(folderPattern, sourceOfValues=null) {
    const availableVariables = this.getAvailableFolderVariables()

    var folderPath = folderPattern.replace(/{{\s*([^}\s]+)\s*}}/g, (match, varIdentifier, offset, string) => {
      if (varIdentifier in availableVariables) {
        if (typeof availableVariables[varIdentifier] == 'function') {
          if (sourceOfValues) {
            return availableVariables[varIdentifier](varIdentifier, sourceOfValues)
          }
          else {
            return `< ${varIdentifier} >`
          }
        }
        else {
          return availableVariables[varIdentifier]
        }
      }

      return match
    })

    return folderPath
  },

  async findPathId(path) {
    const parts = path.split('/').filter((part) => part != '')

    let currentId = 'root'
    for (const part of parts) {
      currentId = await this.getFolderId(part, currentId)
    }

    return currentId
  },

  async getFolderId(name, parentId='root') {
    // https://developers.google.com/drive/api/guides/search-files

    const listQueryParams = {
      q: [
        `name = '${name}'`,
        `'${parentId}' in parents`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        'trashed=false',
      ].join(' and '),
      fields: [
        'files(' + [
          'id',
          'name',
          // 'parents',
          // 'description',
          // 'mimeType',
          // 'createdTime',
          // 'modifiedTime',
          // 'owners',
          // 'permissions',
          // 'shared',
          // 'size',
          // 'webContentLink',
          // 'webViewLink'
        ].join(',') + ')',
        // 'nextPageToken'
      ].join(','),
      // spaces: 'drive',

      orderBy: "createdTime",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    }

    const result = await this.drive.files.list(listQueryParams)
    // console.log('getFolderId() result.data.files', result.data.files)

    let folderId
    if (result.data.files.length == 1) {
      folderId = result.data.files[0].id
    }
    else if (result.data.files.length == 0) {
      const createResult = await this.createFolder(name, parentId)
      folderId = createResult.data.id
    }
    else {
      strapi.log.warn(`More than one folder named '${name}' having the parent '${parentId}' found. Using the first created one`)
      folderId = result.data.files[0].id
    }

    return folderId
  },

  async createFolder(name, parentId=null) {
    return this.drive.files.create({
      requestBody: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId? [parentId] : [],
      },
      fields: 'id'
    })
  },

  uploadBuffer(file, parents=[]) {
    const body = Buffer.from(file.buffer);
    const size = Buffer.byteLength(body);

    return new PProgress(async (resolve, reject, progress) => {
      this.drive.files.create(
        {
          requestBody: {
            name: file.name,
            mimeType: file.mime,
            parents: parents, // https://developers.google.com/drive/api/guides/folder#create
          },
          media: {
            mimeType: file.mime,
            body: new Readable({
              read() {
                this.push(file.buffer);
                this.push(null);
              }
            }),
          }
        },
        {
          onUploadProgress: (evt) => {
            progress(evt.bytesRead / size);
          }
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.data);
          }
        }
      );
    });
  },

  async uploadStream(file, parents=[]) {

    return new PProgress(async (resolve, reject, progress) => {
      this.drive.files.create({
        requestBody: {
          name: file.name,
          mimeType: file.mime,
          parents: parents, // https://developers.google.com/drive/api/guides/folder#create
        },
        media: {
          mimeType: file.mime,
          body: file.stream
        }
      }, {
        onUploadProgress: (evt) => {
          const progressRatio = Math.min(1, evt.bytesRead / (file.size * 1000))
          // console.log(`uploadStream progress ${file.name}`, progressRatio)
          progress(progressRatio);
        }
      }, (err, data) => {
        // console.log('uploadStream resolve', {
        //   name: data.data.name
        // })
        if (err) {
          reject(err);

          /**
           * "User Rate Limit Exceeded.
           * Rate of requests for user exceed configured project quota.
           * You may consider re-evaluating expected per-user traffic to the API and adjust project quota limits accordingly.
           * You may monitor aggregate quota usage and adjust limits in the API Console:
           * https://console.developers.google.com/apis/api/drive.googleapis.com/quotas?project=538656488600"
           */

        } else {
          resolve(data.data);
        }
      });

    });
  },

  getCacheFolderPath() {
    const cacheFolderPath = path.resolve(strapi.dirs.public + '/uploads' + this.config.localUploadFolder)
    return cacheFolderPath
  },

  getFileCachePath(fileName) {
    // Writing in the public folder avoids server restarts in watch dev mode
    const cachePath = this.getCacheFolderPath()
    if (! fs.existsSync(cachePath)) {
      fs.mkdir(cachePath, (error) => {
        if (error) {
          throw new Error(error)
        }
        strapi.log.info('Cache directory created successfully: ' + cachePath);
      });
    }

    const cacheFilePath = path.resolve(cachePath, fileName)

    return cacheFilePath
  },

  async getFilePath(fileBase) {
    const cacheFilePath = this.getFileCachePath(fileBase)

    if (fs.existsSync(cacheFilePath)) {
      return cacheFilePath
    }

    const googleFileId = this.getFileIdFromBase(fileBase)

    try {
      const result = await this.drive.files.get(
        {
          fileId: googleFileId,
          alt: 'media'
        },
        {
          responseType: 'arraybuffer'
        },
      )

      fs.writeFile(cacheFilePath, Buffer.from(result.data),
        'base64',
        function (writeError) {
          if (writeError) {
            return console.log(writeError);
          }
        }
      );
    }
    catch (error) {
      if (error.response?.status == 404) {
        strapi.log.error(`Unable to find '${fileName}' having the id '${googleFileId}' on Google Drive`)
        return null
      }
      throw error
    }

    return cacheFilePath
  },

  async delete(fileBase) {
    const googleFileId = this.getFileIdFromBase(fileBase)
    this.drive.files.delete({ fileId: googleFileId });
    strapi.log.info(`Google Drive file removed: '${googleFileId}'`)

    const cacheFilePath = this.getFileCachePath(fileBase)
    if (fs.existsSync(cacheFilePath)) {
      fs.unlink(cacheFilePath, (error) => {
        if (error) {
          throw new Error(error)
        }
        strapi.log.info(`Google Drive cache file removed: '${cacheFilePath}'`)
      });
    }
  },

  getFileIdFromBase(fileBase) {
    // https://stackoverflow.com/a/52822722/2714285
    const parsedFileName = path.parse(fileBase, true);
    const googleFileId = parsedFileName.name.replace(/^(.+)~([^~]+)$/, (match, fileName, googleDriveFileId) => {
      return googleDriveFileId
    })

    return googleFileId
  }
};
