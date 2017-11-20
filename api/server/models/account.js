'use strict';

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
};
