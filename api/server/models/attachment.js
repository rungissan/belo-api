'use strict';

import Promise from 'bluebird';

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

    let createdFiles = Object.keys(fileObj.files).map(key => fileObj.files[key][0]);
    let createdAttachments = await Promise.map(createdFiles, fileInfo => {
      return createAttachment(userId, fileInfo, dataSourceSettings, hidden);
    });

    return createdAttachments.length > 1 ? createdAttachments : createdAttachments[0];
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

  async function createAttachment(userId, fileInfo, dataSourceSettings, hidden) {
    let attachmentData = {
      userId,
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      container: fileInfo.container,
      containerRoot: dataSourceSettings.root,
      public: !hidden,
      publicUrl: hidden ? null : `${PUBLIC_DIR}/${fileInfo.container}/${fileInfo.name}`,
      sizes: {}
    };

    let attachment = await Attachment.create(attachmentData);

    let kueJobs = Attachment.app.kueJobs;
    kueJobs.createJob('createImgCopies', attachment);

    return attachment;
  }

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
};
