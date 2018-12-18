'use strict';

module.exports = function(Review) {
 
  
  Review.afterRemote('create', afterSaveHook);
  Review.afterRemote('prototype.patchAttributes', afterSaveHook);
  
 
 

  Review.destroyReview = async function(ctx, data) {
   
    const reviewId = data.reviewId || data.id;

    if (!reviewId) return;
 
    await Review.destroyById(reviewId);
    
    return {
      status: true,
      message: 'Review was successfully deleted'
    };
  };

  Review.remoteMethod(
    'destroyReview', {
      description: 'Destroy Review',
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'data',
        type: 'object',
        required: true,
        http: {
          source: 'body'
        }
      }
      ],
      returns: [{
        arg: 'data',
        type: 'Object',
        root: true
      }],
      http: {
        verb: 'delete',
        path: '/destroyReview'
      }
    }
  );

  async function afterSaveHook(ctx, feed) {
    let body = ctx.req.body;

    if (!feed || !body.options) {
      return;
    }

    return await upsertFeedOptions(feed, body.options);
  }

  

 

  Review.banReview = async function(ctx, reviewId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    if (!userId) {
      throw errAccessDenied();
    }
    if (!reviewId) {
      throw errValidation();
    }

    let review = await Review.findById(reviewId);

    if (!(review)) {
      throw errFeedNotFound();
    }

    await Review.app.dataSources.postgres.transaction(async (models) => {
      const timeBanStart = new Date();

    });

    return {
      status: true,
      message: 'Review was successfully banned'
    };
  };

  Review.remoteMethod(
    'banReview',
    {
      description: 'ban review',
      accepts: [
        {arg: 'ctx', type: 'object', http: { source: 'context' }},
        {arg: 'id', type: 'number', required: true}
      ],
      returns: {
        arg: 'account',
        type: 'object',
        root: true
      },
      http: {verb: 'get', path: '/ban-review/:id'}
    }
  );

  
};
