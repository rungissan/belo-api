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

  let relation = await RelationModel.findById(validatedValue, {
    fields: {
      id: true,
      userId: true
    }
  });

  if (!relation) {
    throw errValidation(`Relation ${RelationModel.modelName} id: ${validatedValue} not found`);
  }

  if (validationSettings.checkOwner && !(relation.userId && relation.userId == userId)) {
    throw errAccessDenied(`Access denied for ${RelationModel.modelName} id: ${validatedValue}`);
  }

  return true;
}
