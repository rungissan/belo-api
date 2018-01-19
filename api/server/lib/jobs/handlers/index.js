'use strict';

import imageProcessHandlers from './image-process';
import cleanOpenHousesHandlers from './clean-open-houses';

export default {
  ...imageProcessHandlers,
  ...cleanOpenHousesHandlers
};
