module.exports = function(Appointment) {

    Appointment.searchOrCreate = async function(ctx, appnt) {

        // status: 0 - requesting, 1 - accepted, 2 - canceled by requester

        const data = await Appointment.upsertWithWhere({
            userId: appnt.userId,
            feedId: appnt.feedId,
            listingOwnerId: appnt.listingOwnerId,
        }, {
            userId: appnt.userId,
            feedId: appnt.feedId,
            listingOwnerId: appnt.listingOwnerId,
            lastTimeUpdateBy: appnt.userId,
            status: 0,
            date: appnt.date,
            time: appnt.time
        });

        // const data = await Appointment.findOrCreate({
        //     where: { 
        //         userId: appnt.userId,
        //         feedId: appnt.feedId,
        //         listingOwnerId: appnt.listingOwnerId
        //     }
        // }, {
        //     userId: appnt.userId,
        //     feedId: appnt.feedId,
        //     listingOwnerId: appnt.listingOwnerId,
        //     date: appnt.date,
        //     time: appnt.time,
        //     lastTimeUpdateBy: appnt.userId
        // })

        // if(data[0].status === 2){
        //     const updatedAppnt = await Appointment.upsertWithWhere({
        //         or: [
        //             {
        //                 userId: appnt.userId,
        //                 feedId: appnt.feedId,
        //                 listingOwnerId: appnt.listingOwnerId,
        //                 status: 2
        //             },
        //             {
        //                 userId: appnt.userId,
        //                 feedId: appnt.feedId,
        //                 listingOwnerId: appnt.listingOwnerId,
        //                 status: 0
        //             }
        //         ]
        //     }, {
        //         userId: appnt.userId,
        //         feedId: appnt.feedId,
        //         listingOwnerId: appnt.listingOwnerId,
        //         lastTimeUpdateBy: appnt.userId,
        //         status: 0,
        //         date: appnt.date,
        //         time: appnt.time
        //     });
        //     console.log(updatedAppnt)
        //     return updatedAppnt;
        // }

        console.log(data)

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
                    http: { source: 'context' }
                },
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
}
