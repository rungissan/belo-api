'use strict';

module.exports = function(Geolocation) {
  Geolocation.findOrCreateByPlaceId = async function(geolocationData, place_id) {
    let existentGeolocation = await Geolocation.findOne({
      where: { place_id }
    });

    if (existentGeolocation) {
      return existentGeolocation;
    }

    return await Geolocation.create(geolocationData);
  };

  Geolocation.remoteMethod(
    'findOrCreateByPlaceId',
    {
      description: 'Find or create golocation',
      accepts: [
        {arg: 'geolocationData', type: 'object', http: { source: 'body' }},
        {arg: 'place_id',        type: 'string', required: true}
      ],
      returns: [
        {arg: 'geolocation', type: 'Geolocation'}
      ],
      http: {verb: 'post'}
    }
  );
};
