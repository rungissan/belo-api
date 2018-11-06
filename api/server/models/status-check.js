module.exports = function(StatusCheck) {
    const includeAdditionalData = async (ctx, instance) => {
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
  
        if (!Array.isArray(instance)) {
          return;
        }
        let data = instance;
    
        const {
           Followed
         } = StatusCheck.app.models;
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

    StatusCheck.afterRemote('find', includeAdditionalData);

    StatusCheck.searchOrCreate = async function(ctx, statusData) {
        const { Feed } = StatusCheck.app.models;
        const isFeedPresent = await Feed.findOne({ where: { id: statusData.feedId } })

        if(!isFeedPresent){
            return {
                error: { message: 'Can not find feed. Probably it has been deleted by owner' }
            }
        }

        const data = await StatusCheck.findOrCreate({
            where: { 
                userId: statusData.userId,
                feedId: statusData.feedId,
                listingOwnerId: statusData.listingOwnerId,
                status: 0 // 0 - requesting, 1 - available, 2 - unavailable, 3 - pending, 4 - canceled
            }
        }, {
            userId: statusData.userId,
            feedId: statusData.feedId,
            listingOwnerId: statusData.listingOwnerId,
        })
        return data[0];
    }

    StatusCheck.remoteMethod(
        'searchOrCreate',
        {
            description: 'User creates a request to check listing availability',
            accepts: [
                { 
                    arg: 'ctx',
                    type: 'object',
                    http: { source: 'context' }
                },
                {
                    arg: 'statusData',
                    type: 'object',
                    required: true,
                    http: { source: 'body' }
                }
            ],
            returns: [{ 
                arg: 'data',
                type: 'StatusCheck', 
                root: true
            }],
            http: {
                verb: 'post', 
                path: '/create'
            }
        }
    );
}
