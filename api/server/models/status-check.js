module.exports = function(StatusCheck) {

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
