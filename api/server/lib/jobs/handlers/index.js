'use strict';

import imageProcessHandlers from './image-process';
import cleanOpenHousesHandlers from './clean-open-houses';
import cleanListingsHandlers from './clean-listings';
import nonResizedImagesHandlers from './find-nonresized-images';
import cleanAttachmentFiles from './clean-attachment-files';
import deleteFile from './delete-file';
import sendEmail from './send-email';
import cleanAttachmentsAfterMonth from './clean-attachments-after-month';

export default {
  ...imageProcessHandlers,
  ...cleanOpenHousesHandlers,
  ...cleanListingsHandlers,
  ...nonResizedImagesHandlers,
  ...cleanAttachmentFiles,
  ...deleteFile,
  ...sendEmail,
  ...cleanAttachmentsAfterMonth
};
