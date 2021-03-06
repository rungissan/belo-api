module.exports = function(Appointment) {
    const includeAdditionalData = async (ctx, instance) => {
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
    
        if (!Array.isArray(instance)) {
          return;
        }
        let data = instance;
    
        const {
           Followed
         } = Appointment.app.models;
        const followedIds = await Followed.find({
          where: {
            userId: userId
          }
        }).map(item => item.followedId);
        await Promise.all(data.map(async item => {
            let elem_level1 = item.__data;
            // if current user is owner for listing
            if (elem_level1.listingOwnerId === userId ) { 
              return elem_level1.account.isFollowed =followedIds.includes(elem_level1.userId) ? true : false;
            } 
            // check for avoiding any feeds   
            if (!(elem_level1.feed && elem_level1.feed.__data && elem_level1.feed.__data.account)) return item;

            let elem_level2 = elem_level1.feed.__data;
            let isFollowedFeedOwner = await Followed.find(
                { 
                  where:  { and:  [{ userId: elem_level2.account.userId }, {followedId: userId}] }
                });
            return elem_level2.account.isFollowed = isFollowedFeedOwner.length > 0 ? true : false
        }));
        return data;
    };

    Appointment.afterRemote('find', includeAdditionalData);

    Appointment.searchOrCreate = async function(ctx, appnt) {

        const { Feed } = Appointment.app.models;
        const isFeedPresent = await Feed.findOne({ where: { id: appnt.feedId } })

        if(!isFeedPresent){
            return {
                error: { message: 'Can not find feed. Probably it has been deleted by owner' }
            }
        }
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

    Appointment.banAppointment = async function(ctx, appointmentId) {
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
        if (!userId) {
          throw errAccessDenied();
        }
      
        let appointment = await Appointment.findById(appointmentId);
    
        if (!(appointment)) {
          throw errAccessDenied();
        }

        const timeBanStart = new Date();
         
        await appointment.updateAttributes({
            banned_at: timeBanStart,
            deleted_at: timeBanStart,
            updated_at: timeBanStart
          });
    
         return {
          status: true,
          message: `appointment  was successfully banned`
        };
      };
    
      Appointment.remoteMethod(
        'banAppointment',
        {
          description: 'Ban Appointment info.',
          accepts: [
            {arg: 'ctx', type: 'object', http: { source: 'context' }},
            {arg: 'id', type: 'number', required: true}
          ],
          returns: { arg: 'appointment', type: 'Appointment', root: true},
          http: {verb: 'get', path: '/ban-appointment/:id'}
        }
      );
}
