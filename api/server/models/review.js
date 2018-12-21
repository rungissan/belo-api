'use strict';

import {
  errUnauthorized,
  errReviewNotFound 
} from '../lib/errors.js';

module.exports = function(Review) {
 
  
  //Review.afterRemote('create', afterSaveHook);
  //Review.afterRemote('prototype.patchAttributes', afterSaveHook);
  
 
 

  Review.destroyReview = async function(ctx, data) {
    const reviewId = data.reviewId || data.id;
    let reviewsCount,reviewsScoreSum;

    if (!reviewId) return errReviewNotFound();
    const { Account } = Review.app.models;

    const review = await Review.findById(reviewId);
    if (!review) return errReviewNotFound();

    console.log(review);
    
    let account = await Account.findOne({
      where: {
        userId:review.__data.profId
      }
    });

    await Review.app.dataSources.postgres.transaction(async (models) => {
     
      await Review.destroyById(reviewId);
      if (account.__data.reviewsCount <=0 ) {
        reviewsCount = 0;
        reviewsScoreSum = 0;
      } else {
        reviewsCount =  --account.__data.reviewsCount;
        reviewsScoreSum = account.__data.reviewsScoreSum - review.rating;

      }
      await account.updateAttributes({reviewsCount: reviewsCount, reviewsScoreSum: reviewsScoreSum});  
           
    });

    
    return {
      status: true,
      message: 'Review was successfully deleted',
      data, reviewsCount,reviewsScoreSum 
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

  Review.createReview = async function(ctx, review) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let data;
    let reviewsCount;
    let reviewsScoreSum;

    const { Account } = Review.app.models;

    if (!userId) {
       return errUnauthorized();
     }


    await Review.app.dataSources.postgres.transaction(async (models) => {
      data = await Review.upsertWithWhere({
        userId: userId,
        profId: review.profId,
        rating: review.rating,
        review: review.review
      }, {
        userId: userId,
        profId: review.profId,
        rating: review.rating,
        review: review.review
      });

      let account = await Account.findOne({
        where: {
          userId:review.profId
        }
      });
              
      reviewsCount = account.__data.reviewsCount;
      reviewsScoreSum = account.__data.reviewsScoreSum + review.rating;
      await account.updateAttributes({reviewsCount: ++reviewsCount, reviewsScoreSum: reviewsScoreSum});  
           
    });

    console.log(review)

    return {   status: true,
               message: 'Review was successfully added',
               data, reviewsCount,reviewsScoreSum  };
}


   Review.remoteMethod(
    'createReview',
    {
        description: 'Create review',
        accepts: [
           {arg: 'ctx', type: 'object', http: { source: 'context' }},
            {
                arg: 'review',
                type: 'object',
                required: true,
                http: { source: 'body' }
            }
        ],
        returns: [{ 
            arg: 'data', 
            type: 'Review', 
            root: true
        }],
        http: {
            verb: 'post', 
            path: '/create'
        }
    }
);
  

 

  Review.banReview = async function(ctx, reviewId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
 
    if (!userId) {
      throw errAccessDenied();
    }
    if (!reviewId) {
      throw errValidation();
    }

    const timeBanStart = new Date();

    let review = await Review.updateAll({
      id: feedId
    }, {
      banned_at: timeBanStart,
      deleted_at: timeBanStart,
      updated_at: timeBanStart
    });

     if (!(review)) {
      throw errFeedNotFound();
    }

    await Review.app.dataSources.postgres.transaction(async (models) => {
      //
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
