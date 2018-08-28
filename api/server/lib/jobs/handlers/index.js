'use strict';

import imageProcessHandlers from './image-process';
import cleanOpenHousesHandlers from './clean-open-houses';
import cleanListingsHandlers from './clean-listings';

export default {
  ...imageProcessHandlers,
  ...cleanOpenHousesHandlers,
  ...cleanListingsHandlers
};
