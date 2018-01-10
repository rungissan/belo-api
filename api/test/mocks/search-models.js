'use strict';

const TestProduct = {
  'name': 'TestProduct',
  'base': 'PersistedModel',
  'idInjection': true,
  'options': {
    'validateUpsert': true,
    'postgresql': {
      'schema': 'test',
      'table': 'test_product'
    }
  },
  'properties': {
    'id': {
      'type': 'number',
      'id': true
    },
    'categoryId': {
      'type': 'number',
      'postgresql': {
        'columnName': 'categoryId',
        'dataType': 'integer'
      }
    },
    'type': 'string',
    'description': 'string',
    'quantity': 'number'
  },
  'relations': {
    'category': {
      'type': 'belongsTo',
      'model': 'TestCategory',
      'foreignKey': 'categoryId'
    },
    'productOptions': {
      'type': 'hasOne',
      'model': 'TestProductOptions',
      'foreignKey': 'productId'
    },
    'locations': {
      'type': 'hasMany',
      'model': 'TestLocation',
      'through': 'TestLocationToProduct',
      'foreignKey': 'productId',
      'keyThrough': 'locationId'
    }
  }
};

const TestCategory = {
  'name': 'TestCategory',
  'base': 'PersistedModel',
  'idInjection': true,
  'options': {
    'validateUpsert': true,
    'postgresql': {
      'schema': 'test',
      'table': 'test_category'
    }
  },
  'properties': {
    'id': {
      'type': 'number',
      'id': true
    },
    'name': 'string',
    'published': 'boolean'
  },
  'relations': {
    'product': {
      'type': 'hasOne',
      'model': 'TestProduct',
      'foreignKey': 'categoryId'
    }
  }
};

const TestProductOptions = {
  'name': 'TestProductOptions',
  'base': 'PersistedModel',
  'idInjection': true,
  'options': {
    'validateUpsert': true,
    'postgresql': {
      'schema': 'test',
      'table': 'test_product_options'
    }
  },
  'properties': {
    'productId': {
      'type': 'number',
      'id': true
    },
    'settings': {
      'type': 'object',
      'postgresql': {
        'columnName': 'settings',
        'dataType': 'jsonb'
      }
    },
    'price': 'number',
    'deleted_at': 'date'
  },
  'relations': {
    'product': {
      'type': 'belongsTo',
      'model': 'TestProduct',
      'foreignKey': 'productId'
    }
  }
};

const TestLocation = {
  'name': 'TestLocation',
  'base': 'PersistedModel',
  'idInjection': true,
  'options': {
    'validateUpsert': true,
    'postgresql': {
      'schema': 'test',
      'table': 'test_location'
    }
  },
  'properties': {
    'id': {
      'type': 'number',
      'id': true
    },
    'name': 'string',
    'price': 'number'
  }
};

const TestLocationToProduct = {
  'name': 'TestLocationToProduct',
  'base': 'PersistedModel',
  'idInjection': true,
  'options': {
    'validateUpsert': true,
    'postgresql': {
      'schema': 'test',
      'table': 'test_location_to_product'
    }
  },
  'properties': {
    'id': {
      'type': 'number',
      'id': true
    },
    'productId': 'number',
    'locationId': 'number'
  }
};

export default {
  TestLocationToProduct,
  TestLocation,
  TestProduct,
  TestCategory,
  TestProductOptions
};
