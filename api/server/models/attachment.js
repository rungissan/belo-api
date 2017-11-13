'use strict';

const CONTAINERS_URL    = '/api/containers/';
const PUBLIC_DIR        = '/uploads';

module.exports = function(Attachment) {

  Attachment.upload = function(ctx, options, cb) {
    if (!options) options = {};

    const token = ctx.args.options && ctx.args.options.accessToken;
    const userId = token && token.userId;

    let StorageContainer;
    let container;
    if (options.private) {
      StorageContainer = Attachment.app.models.ContainerPrivate;
      container = 'uploads';
    } else {
      StorageContainer = Attachment.app.models.ContainerPublic;
      container = 'uploads';
    }

    ctx.req.params.container = container;

    StorageContainer.upload(ctx.req, ctx.result, options, function(err, fileObj) {
      if (err) {
        cb(err);
      } else {
        var fileInfo = fileObj.files.file[0];

        let attachmentData = {
          ownerId: userId,
          name: fileInfo.name,
          type: fileInfo.type,
          container: fileInfo.container,
          url: CONTAINERS_URL + fileInfo.container + '/download/' + fileInfo.name,
          publicUrl: options.private ? null : `${PUBLIC_DIR}/${fileInfo.name}`
        }

        return Attachment.create(attachmentData)
          .then(createdAttachment => {
            cb(null, createdAttachment);
          })
          .catch(cb);
      }
    });
  };

  Attachment.remoteMethod(
    'upload', {
      description: 'Uploads a file',
      accepts: [
        { arg: 'ctx',     type: 'object', http: { source: 'context' } },
        { arg: 'options', type: 'object', http: { source: 'query' } }
      ],
      returns: { arg: 'fileObject', type: 'object', root: true },
      http: { verb: 'post' }
    }
  );

};
