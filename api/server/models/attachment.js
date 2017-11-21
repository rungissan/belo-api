'use strict';

import Promise  from 'bluebird';
import gm       from 'gm';
import { join } from 'path';

import { errUnsupportedContainer } from '../lib/errors';

const CONTAINERS_URL    = '/api/containers/';
const PUBLIC_DIR        = '/public';
const DEFAULT_CONTAINER = 'uploads';
const CONTAINERS_WITH_THUMBS = ['uploads', 'post', 'listing'];

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

    let copies;
    if (dataSourceSettings.provider == 'filesystem' && CONTAINERS_WITH_THUMBS.includes(containerName)) {
      copies = await createImgCopies(fileInfo, dataSourceSettings.root);
    }

    let attachmentData = {
      userId,
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      container: fileInfo.container,
      publicUrl: hidden ? null : `${PUBLIC_DIR}/${fileInfo.container}/${fileInfo.name}`,
      copies
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

    if (sizePrefix && Array.isArray(attachment.copies)) {
      let customSize = attachment.copies.find(copy => copy.sizePrefix == sizePrefix);
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

  const DEFAULT_COPY_OPTIONS = [{
    sizePrefix: '50_50',
    width: 50,
    height: 50
  }];

  function createImgCopies(fileInfo, rootPath) {
    return Promise.map(DEFAULT_COPY_OPTIONS, (copyOptions) => {
      return createImgCopy(fileInfo, rootPath, copyOptions)
        .then(fileName => {
          return {
            ...copyOptions,
            fileName
          };
        });
    });
  }

  function createImgCopy(fileInfo, rootPath, options) {
    let fileSrc  = join(rootPath, fileInfo.container, fileInfo.name);
    let fileNameDest = `${options.sizePrefix}_${fileInfo.name}`;
    let fileDest = join(rootPath, fileInfo.container, fileNameDest);

    return new Promise((resolve, reject) => {
      gm(fileSrc)
        .thumb(options.width, options.height, fileDest, 100, function(err) {
          if (err) {
            reject(err);
          };

          resolve(fileNameDest);
        });
    });
  }
};
