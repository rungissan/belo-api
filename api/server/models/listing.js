'use strict';

module.exports = function(Listing) {
  Listing.validatesInclusionOf('rent_type', {in: ['rent', 'sale']});
};
