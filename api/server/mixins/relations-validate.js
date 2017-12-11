'use strict';

import Promise from 'bluebird';

import {
  errAccessDenied,
  errValidation
} from '../lib/errors';

const VALIDATION_HANDLERS = {
  'belongsTo': validateBelongsTo
};

/**
 * @desc Mixin that check if foreign key is present (loopback not validationg foreign keys).
 * Additionally could check if foreign relation is owned by user.
 * @param {Object} Model loopback model.
 * @param {Object} options mixin options
 * @property {Object} relationName name of relation to validate
 */
export default function(Model, options = {}) {
  let settings = Object.keys(options)
    .map(key => {
      return {
        relationName: key,
        ...options[key]
      };
    });

  if (!settings.length) {
    return;
  }

  settings = settings.map(validationSettings => getRelationSettings(validationSettings, Model));

  Model.observe('before save', validateRelations(settings, Model));
};

const ALLOWED_RELATION_TYPES = ['belongsTo'];

function getRelationSettings(validationSettings, Model) {
  const { relationName } = validationSettings;

  let Relation;
  let relations = Model.definition.settings.relations;

  let relation = relations[relationName];

  if (!relation) {
    throw new Error(`Relation ${relationName} not found`);
  }

  if (!ALLOWED_RELATION_TYPES.includes(relation.type)) {
    throw new Error(`Relation type ${relation.type} not supported currently`);
  }

  if (validationSettings.checkOwner && validationSettings.checkNotOwner) {
    throw new Error('Can not validate checkOwner and checkNotOwner simultaneously');
  }

  if (validationSettings.validateProps) {
    Object.keys(validationSettings.validateProps).map(prop => {
      let validation = validationSettings.validateProps[prop];

      if (typeof validation == 'object' && (!validation.is && !validation.not)) {
        throw new Error('Property validation should have "is" or "not" parameter');
      }
    });
  }

  validationSettings.relation = relation;
  return validationSettings;
}

function validateRelations(settings, Model) {
  return async function(ctx) {
    let instance = ctx.instance || ctx.data;
    if (!instance) {
      return;
    }

    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;

    await Promise.map(settings, validationSettings => {
      let RelationModel = Model.app.models[validationSettings.relation.model];
      return VALIDATION_HANDLERS[validationSettings.relation.type](userId, instance, validationSettings, RelationModel);
    });
  };
}

async function validateBelongsTo(userId, instance, validationSettings, RelationModel) {
  let validatedValue = instance[validationSettings.relation.foreignKey];

  if (!validatedValue && validatedValue !== 0) {
    return true;
  }

  let fields = {
    id: true,
    userId: true
  };
  if (validationSettings.validateProps) {
    Object.keys(validationSettings.validateProps).forEach(key => {
      fields[key] = true;
    });
  }

  let relation = await RelationModel.findById(validatedValue, { fields });

  if (!relation) {
    throw errValidation(`Relation ${RelationModel.modelName} id: ${validatedValue} not found`);
  }

  if (validationSettings.checkOwner && !(relation.userId && relation.userId == userId)) {
    throw errAccessDenied(`Access denied for ${RelationModel.modelName} id: ${validatedValue}`);
  }

  if (validationSettings.checkNotOwner && relation.userId && relation.userId == userId) {
    throw errValidation(`Setting own relations is not allowed - ${RelationModel.modelName} id: ${validatedValue}`);
  }

  if (validationSettings.validateProps) {
    validateProps(relation, validationSettings.validateProps);
  }

  return true;
}

function validateProps(relation, validateProps = {}) {
  Object.keys(validateProps).map(prop => {
    let validation = validateProps[prop];
    if (typeof validation != 'object') {
      if (relation[prop] !== validation) {
        throw errValidation(`Can link relation with ${prop}: ${validation}`);
      }
    } else {
      if (validation.is && relation[prop] !== validation.is) {
        throw errValidation(validation.message || `Can link relation with ${prop} is ${validation}`);
      } else if (validation.not && relation[prop] !== validation.not) {
        throw errValidation(validation.message || `Can link relation with ${prop} not ${validation}`);
      }
    }
  });
}
