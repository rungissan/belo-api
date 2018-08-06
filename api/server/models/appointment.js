module.exports = function(Appointment) {

    Appointment.searchOrCreate = async function(ctx, appnt) {
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
        const data = appnt
        return data;
    }

    Appointment.remoteMethod(
        'searchOrCreate',
        {
            description: 'Create appointment',
            accepts: [
                { 
                    arg: 'ctx',
                    type: 'object', 
                    http: { source: 'context' } },
                {
                    arg: 'appnt',
                    type: 'object',
                    required: true,
                    http: { source: 'body' }
                }
            ],
            returns: [{ 
                arg: 'data', 
                type: 'Appointment', 
                root: true
            }],
            http: {
                verb: 'post', 
                path: '/create'
            }
        }
    );
    // Appointment.searchOrCreate = async function(geolocationData) {
    //     const existentGeolocation = await Geolocation.findOne({
    //       where: { place_id: geolocationData.place_id }
    //     });
    
    //     if (existentGeolocation) {
    //       return existentGeolocation;
    //     }
    
    //     return await Geolocation.create(geolocationData);
    //   };
    
    // Appointment.remoteMethod(
    // 'searchOrCreate',
    //     {
    //         description: 'Find or create geolocation',
    //         accepts: [{
    //         arg: 'geolocationData',
    //         type: 'object',
    //         http: { source: 'body' },
    //         description: 'data property can be used to store original gmaps geolocation data'
    //         }],
    //         returns: [ {arg: 'geolocation', type: 'Geolocation', root: true} ],
    //         http: {verb: 'post', path: '/search-or-create'}
    //     }
    // );
}
