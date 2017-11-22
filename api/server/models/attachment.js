'use strict';

import Promise  from 'bluebird';
import gm       from 'gm';
import {
  join,
  extname,
  basename
} from 'path';

import { errUnsupportedContainer } from '../lib/errors';

const CONTAINERS_URL    = '/api/containers/';
const PUBLIC_DIR        = '/public';
const DEFAULT_CONTAINER = 'uploads';
const CONTAINERS_WITH_THUMBS = ['uploads', 'post', 'listing'];
const DEFAULT_COPY_OPTIONS = [{
  sizePrefix: 'thumbnail',
  width: 150,
  height: null,
  quality: 100
}, {
  sizePrefix: 'big',
  width: 1280,
  height: null,
  quality: 100
}];

module.exports = function(Attachment) {
  // TODO: fix settings, check file type before creating thumbnails, possible skip thumbnailt with api param
  Attachment.upload = async function(ctx, hidden, containerName = DEFAULT_CONTAINER) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let StorageContainer;
    if (hidden) {
      StorageContainer = Attachment.app.models.ContainerPrivate;
    } else {
      StorageContainer = Attachment.app.models.ContainerPublic;
    }

    let validContainers = StorageContainer.settings.validContainers || [];

    if (containerName != DEFAULT_CONTAINER && !validContainers.includes(containerName)) {
      throw errUnsupportedContainer(containerName);
    }

    ctx.req.params.container = containerName;

    let dataSourceSettings = StorageContainer.getDataSource().settings;

    let fileObj = await uploadFileWithContainer(StorageContainer, ctx);
    let fileInfo = fileObj.files.file[0];

    let sizes;
    if (dataSourceSettings.provider == 'filesystem' && CONTAINERS_WITH_THUMBS.includes(containerName)) {
      sizes = await createImgCopies(fileInfo, dataSourceSettings.root, hidden);
    }

    let attachmentData = {
      userId,
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      container: fileInfo.container,
      publicUrl: hidden ? null : `${PUBLIC_DIR}/${fileInfo.container}/${fileInfo.name}`,
      sizes
    };

    return await Attachment.create(attachmentData);
  };

  Attachment.remoteMethod(
    'upload',
    {
      description: 'Uploads a file',
      accepts: [
        { arg: 'ctx',       type: 'object',  http: { source: 'context' } },
        { arg: 'hidden',    type: 'boolean', http: { source: 'query' } },
        { arg: 'container', type: 'string',  http: { source: 'query' } }
      ],
      returns: { arg: 'fileObject', type: 'object', root: true },
      http: { verb: 'post' }
    }
  );

  Attachment.prototype.download = function(ctx, sizePrefix, cb) {
    let attachment = this;
    let attachmentName = attachment.name;

    if (sizePrefix && Array.isArray(attachment.sizes)) {
      let customSize = attachment.sizes.find(copy => copy.sizePrefix == sizePrefix);
      if (customSize && customSize.fileName) {
        attachmentName = customSize.fileName;
      }
    }

    let StorageContainer;
    if (attachment.publicUrl) {
      StorageContainer = Attachment.app.models.ContainerPublic;
    } else {
      StorageContainer = Attachment.app.models.ContainerPrivate;
    }

    // res is processed inside. executing cb will cause error (set headers after they are sent)
    StorageContainer.download(attachment.container, attachmentName, ctx.req, ctx.res, () => {});
  };

  Attachment.remoteMethod(
    'prototype.download',
    {
      description: 'Download a file',
      accepts: [
        { arg: 'ctx',  type: 'object', http: { source: 'context' } },
        { arg: 'size', type: 'string', http: { source: 'query' } }
      ],
      returns: { arg: 'fileObject', type: 'object', root: true },
      http: { verb: 'get' }
    }
  );

  function uploadFileWithContainer(StorageContainer, ctx) {
    return new Promise((resolve, reject) => {
      StorageContainer.upload(ctx.req, ctx.result, {}, (err, fileObj) => {
        if (err) {
          reject(err);
        } else {
          resolve(fileObj);
        }
      });
    });
  }

  function createImgCopies(fileInfo, rootPath, hidden = false) {
    return Promise.map(DEFAULT_COPY_OPTIONS, (copyOptions) => {
      return createImgCopy(fileInfo, rootPath, copyOptions)
        .then(fileName => {
          return {
            ...copyOptions,
            fileName,
            publicUrl: hidden ? null : `${PUBLIC_DIR}/${fileInfo.container}/${fileName}`
          };
        });
    })
      .then(copies => {
        let copiesObj = {};
        copies.forEach(copy => {
          copiesObj[copy.sizePrefix] = copy;
        });
        return copiesObj;
      });
  }

  function createImgCopy(fileInfo, rootPath, options) {
    let fileOriginalPath  = join(rootPath, fileInfo.container, fileInfo.name);
    let fileOriginalExtname  = extname(fileOriginalPath);
    let fileOriginalBasename = basename(fileOriginalPath, fileOriginalExtname);
    let fileDestName = `${fileOriginalBasename}_${options.sizePrefix}${fileOriginalExtname}`;
    let fileDestPath = join(rootPath, fileInfo.container, fileDestName);

    return new Promise((resolve, reject) => {
      let processImage = gm(fileOriginalPath);

      processImage.resize(options.width, options.height);

      if (options.quality) {
        processImage.quality(options.quality);
      }

      processImage.write(fileDestPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(fileDestName);
        }
      });
    });
  }
};
