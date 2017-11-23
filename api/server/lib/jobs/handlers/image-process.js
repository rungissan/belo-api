'use strict';

import Promise from 'bluebird';
import gm      from 'gm';
import {
  join,
  extname,
  basename
} from 'path';

const BASE_DIR = '/usr/src/storage';
const DEFAULT_SIZE_OPTIONS = [{
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

export default {
  createImgCopies: {
    handler: createImgCopies,
    options: {
      delay: 1500, // ms
      attempts: 3,
      backoff: {
        delay: 5000, // ms
        type: 'fixed'
      },
      removeOnComplete: true
    }
  }
};

async function createImgCopies(app, job) {
  const Attachment = app.models.Attachment;

  let data = job.data || {};

  if (!data.id) {
    return true;
  }

  let attachment = await Attachment.findById(data.id);

  if (!attachment) {
    return true;
  }

  let presentSizes = attachment.sizes;
  let missingSizes = [];

  DEFAULT_SIZE_OPTIONS.forEach(size => {
    if (!presentSizes[size.sizePrefix]) {
      missingSizes.push(size);
    }
  });

  if (missingSizes.length) {
    let createdSizes = await transformImages(missingSizes, attachment);
    return await attachment.updateAttributes({
      sizes: {...presentSizes, ...createdSizes}
    });
  }

  return true;
}

function transformImages(missingSizes, attachment) {
  return Promise.map(missingSizes, (sizeOptions) => {
    return createImgCopy(attachment, sizeOptions)
      .then(fileOptions => {
        return {
          ...sizeOptions,
          ...fileOptions
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

function createImgCopy(attachment, options) {
  let { containerRoot, container, name } = attachment;

  let fileOriginalPath  = join(containerRoot, container, name);
  let fileOriginalExtname  = extname(fileOriginalPath);
  let fileOriginalBasename = basename(fileOriginalPath, fileOriginalExtname);
  let fileDestName = `${fileOriginalBasename}_${options.sizePrefix}${fileOriginalExtname}`;
  let fileDestPath = join(containerRoot, container, fileDestName);

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
        resolve({
          fileName: fileDestName,
          publicUrl: attachment.public ? `${containerRoot.replace(BASE_DIR, '')}/${attachment.container}/${fileDestName}` : null
        });
      }
    });
  });
}
