'use strict';

module.exports = function(Geolocation) {
  Geolocation.searchOrCreate = async function(geolocationData, place_id) {
    let existentGeolocation = await Geolocation.findOne({
      where: { place_id }
    });

    if (existentGeolocation) {
      return existentGeolocation;
    }

    return await Geolocation.create(geolocationData);
  };

  Geolocation.remoteMethod(
    'searchOrCreate',
    {
      description: 'Find or create geolocation',
      accepts: [{
        arg: 'geolocationData',
        type: 'Geolocatin',
        http: { source: 'body' },
        description: 'data property can be used to store original gmaps geolocation data'
      }],
      returns: [
        {arg: 'geolocation', type: 'Geolocation', root: true}
      ],
      http: {verb: 'post', path: '/search-or-create'}
    }
  );
};
