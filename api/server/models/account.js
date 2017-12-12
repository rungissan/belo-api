'use strict';

import Promise from 'bluebird';

module.exports = function(Account) {
  Account.validatesLengthOf('licenseState',  {max: 4,   allowBlank: true, allowNull: true});
  Account.validatesLengthOf('licenseNumber', {max: 50,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('licenseType',   {max: 50,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('brokerage',     {max: 100, allowBlank: true, allowNull: true});
  Account.validatesLengthOf('phone',         {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('userName',      {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('lastName',      {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('firstName',     {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('type',          {max: 20,  allowBlank: true, allowNull: true});

  Account.validatesUniquenessOf('userName',  {max: 30});

  Account.afterRemote('findById', includeCounts);

  async function includeCounts(ctx, instance) {
    if (!(instance && instance.userId)) {
      return;
    }

    let filter = ctx.args && ctx.args.filter || {};
    let populate = filter.populate;
    if (!Array.isArray(populate)) {
      return;
    }

    let queries = {};
    const Followed = Account.app.models.Followed;

    if (populate.includes('followersCount')) {
      queries.followersCount = Followed.count({ followedId: instance.userId });
    }
    if (populate.includes('followedCount')) {
      queries.followedCount = Followed.count({ userId: instance.userId });
    }

    if (Object.keys(queries).length === 0) {
      return;
    }

    let props = await Promise.props(queries);

    ctx.result.followersCount = props.followersCount;
    ctx.result.followedCount = props.followedCount;

    return;
  };
};
