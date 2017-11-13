'use strict';

import Promise from 'bluebird';

const CONTAINERS_URL    = '/api/containers/';
const PUBLIC_DIR        = '/uploads';

module.exports = function(Attachment) {
  Attachment.upload = function(ctx, hidden, cb) {
    let options = {};

    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let StorageContainer;
    let containerName;
    if (hidden) {
      StorageContainer = Attachment.app.models.ContainerPrivate;
      containerName = 'uploads';
    } else {
      StorageContainer = Attachment.app.models.ContainerPublic;
      containerName = 'uploads';
    }

    ctx.req.params.container = containerName;

    return StorageContainer.upload(ctx.req, ctx.result, {}, function(err, fileObj) {
      if (err) {
        return cb(err);
      }

      let fileInfo = fileObj.files.file[0];

      let attachmentData = {
        userId,
        name: fileInfo.name,
        type: fileInfo.type,
        size: fileInfo.size,
        container: fileInfo.container,
        url: CONTAINERS_URL + fileInfo.container + '/download/' + fileInfo.name,
        publicUrl: hidden ? null : `${PUBLIC_DIR}/${fileInfo.name}`
      };

      return Attachment.create(attachmentData)
        .then(attachment => {
          return cb(null, attachment);
        })
        .catch(cb);
    });
  };

  Attachment.remoteMethod(
    'upload',
    {
      description: 'Uploads a file',
      accepts: [
        { arg: 'ctx',     type: 'object',  http: { source: 'context' } },
        { arg: 'hidden',  type: 'boolean', http: { source: 'query' } }
      ],
      returns: { arg: 'fileObject', type: 'object', root: true },
      http: { verb: 'post' }
    }
  );

  Attachment.prototype.download = function(ctx, cb) {
    let attachment = this;
    let StorageContainer;

    if (attachment.publicUrl) {
      StorageContainer = Attachment.app.models.ContainerPublic;
    } else {
      StorageContainer = Attachment.app.models.ContainerPrivate;
    }

    // res is processed inside. executing cb will cause error (set headers after they are sent)
    StorageContainer.download(attachment.container, attachment.name, ctx.req, ctx.res, () => {});
  };

  Attachment.remoteMethod(
    'prototype.download',
    {
      description: 'Download a file',
      accepts: [
        { arg: 'ctx', type: 'object', http: { source: 'context' } }
      ],
      returns: { arg: 'fileObject', type: 'object', root: true },
      http: { verb: 'get' }
    }
  );
};
