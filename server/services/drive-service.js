const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { google } = require('googleapis');
const mime = require('mime');
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

    this.logger = strapi.log;

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
      throw new Error(`Invalid Client Id: ${JSON.stringify(clientId)}`)
    }

    if (! clientSecret.match(/^.+$/)) {
      throw new Error(`Invalid Client Secret: ${JSON.stringify(clientSecret)}`)
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
    // TODO get variables from the provider config

    // name: 'small_IMG_20220405_185848.jpg',
    // hash: 'small_IMG_20220405_185848_46dccfe0b9',
    // ext: '.jpg',
    // mime: 'image/jpeg',
    // path: null,
    // getStream: [Function: getStream],
    // width: 500,
    // height: 375,
    // size: 45.74,

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
    // console.log('getFolderId', name, parentId)

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

      // orderBy: "name",
      orderBy: "createdTime",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    }

    // console.log('listQueryParams', listQueryParams)

    const result = await this.drive.files.list(listQueryParams)

    // console.log('getFolderId() result.data.files', result.data.files)

    let folderId
    if (result.data.files.length == 1) {
      folderId = result.data.files[0].id
    }
    else if (result.data.files.length == 0) {
      const createResult = await this.createFolder(name, parentId)
      // console.log('createResult', createResult)
      folderId = createResult.data.id
    }
    else {
      console.log(`More than one folder named '${name}' having the parent '${parentId}' found. Using the first created one`)
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


  // setThrottle(bytes = 0) {
  //   if (bytes) {
  //     this.tg = new ThrottleGroup({rate: bytes});
  //   } else {
  //     this.tg = null;
  //   }

  //   return this;
  // },

  bufferToStream(binary) {
    const readableInstanceStream = new Readable({
      read() {
        this.push(binary);
        this.push(null);
      }
    });

    return readableInstanceStream;
  },

  uploadBuffer(file, parents=[]) {
    const { name, ext, mime, buffer, folderId } = file;

    console.log('uploadBuffer file', file)

    // TODO https://developers.google.com/drive/api/guides/folder#create
    // if (folderId) {
    //   fileMetadata.parents = [folderId];
    // }

    const body = Buffer.from(buffer);
    const size = Buffer.byteLength(body);

    return new PProgress(async (resolve, reject, progress) => {
      this.drive.files.create({
        requestBody: {
          name: file.name,
          mimeType: file.mime,
          parents: parents, // https://developers.google.com/drive/api/guides/folder#create
        },
        media: {
          mimeType: file.mime,
          body: this.bufferToStream(file.buffer)
        }
      }, {
        onUploadProgress: (evt) => {
          progress(evt.bytesRead / size);
        }
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.data);
        }
      });
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


  // async getDownloadUrl(fileId) {
  //   const { data, headers, config } = await this.oAuth2Client.request({
  //     url: `https://www.googleapis.com/drive/v2/files/${fileId}`
  //   });

  //   // console.log('getDownloadUrl url', data.downloadUrl)

  //   return data.downloadUrl;
  // },

  async downloadFile(googleFileId, extension) {
    // Writing in the punlic folder avoids server restarts in watch dev mode
    const cachePath = path.resolve(strapi.dirs.public + '/uploads/cache')
    if (! fs.existsSync(cachePath)) {
      fs.mkdir(cachePath, (err) => {
        if (error) {
          throw new Error(error)
        }
        console.log('Cache directory created successfully: ' + cachePath);
      });
    }

    const cacheFile = path.resolve(cachePath, googleFileId + '.' + extension)
    if (fs.existsSync(cacheFile)) {
      const cacheData = fs.readFileSync(cacheFile)
      const mimeType = mime.getType(extension)

      // TODO add HTTP cache headers
      // cache-control	"private, max-age=0, must-revalidate"
      // connection	"close"
      // content-disposition	"attachment"
      // content-length	"10730"
      // content-type	"image/jpeg"
      // date	"Mon, 25 Jul 2022 14:30:18 GMT"
      // expires	"Mon, 25 Jul 2022 14:30:18 GMT"
      return {
        headers: {
          'content-type': mimeType,
        },
        data: cacheData
      }
    }

    const result = await this.drive.files.get(
      {
        fileId: googleFileId,
        alt: 'media'
      },
      {
        responseType: 'arraybuffer'
      },
    )

    // Buffer must be copied to be written in the cache file
    // AND responsed by the current http request
    result.data = Buffer.from(result.data)

    fs.writeFile(cacheFile, Buffer.from(result.data),
      'base64',
      function (writeError) {
        if (writeError) {
          return console.log(writeError);
        }
      }
    );

    return result
  },

  async delete(googleFileId, extension) {
    // console.log('delete googleFileId', googleFileId)

    this.drive.files.delete({ fileId: googleFileId });

    const cachePath = path.resolve(strapi.dirs.public + '/uploads/cache')
    const cacheFile = path.resolve(cachePath, googleFileId + extension)
    if (fs.existsSync(cacheFile)) {
      fs.unlink(cacheFile, (error) => {
        if (error) {
          throw new Error(error)
        }
      });
    }

  },
};
