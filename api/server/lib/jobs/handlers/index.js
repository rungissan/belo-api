'use strict';

import imageProcessHandlers from './image-process';
import cleanOpenHousesHandlers from './clean-open-houses';
import cleanListingsHandlers from './clean-listings';
// import nonResizedImagesHandlers from './find-nonresized-images';

export default {
  ...imageProcessHandlers,
  ...cleanOpenHousesHandlers,
  ...cleanListingsHandlers
//  ...nonResizedImagesHandlers
};
