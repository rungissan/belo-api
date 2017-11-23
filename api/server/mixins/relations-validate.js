'use strict';

import Promise from 'bluebird';

import {
  errAccessDenied,
  errValidation
} from '../lib/errors';

const VALIDATION_HANDLERS = {
  'belongsTo': validateBelongsTo
};

export default function(Model, options = {}) {
  let settings = Object.keys(options)
    .map(key => {
      return {
        modelName: key,
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
  const { modelName, type, foreignKey } = validationSettings;

  if (!modelName) {
    throw new Error('modelName must be specified');
  }

  let Relation;
  let relations = Model.definition.settings.relations;

  let relation = Object.keys(relations)
    .map(key => relations[key])
    .find(rel => {
      return rel.model == modelName &&
        (!type || rel.type == type) &&
        (!foreignKey || rel.foreignKey == foreignKey);
    });

  if (!relation) {
    throw new Error(`Relation ${modelName} not found`);
  }

  if (!ALLOWED_RELATION_TYPES.includes(relation.type)) {
    throw new Error(`Relation type ${relation.type} not supported currently`);
  }

  validationSettings.relation = relation;
  return validationSettings;
}

function validateRelations(settings, Model) {
  return async function(ctx) {
    if (!ctx.instance || ctx.instance.id) {
      return;
    }

    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;

    await Promise.map(settings, validationSettings => {
      let RelationModel = Model.app.models[validationSettings.relation.model];
      return VALIDATION_HANDLERS[validationSettings.relation.type](userId, ctx.instance, validationSettings, RelationModel);
    });
  };
}

async function validateBelongsTo(userId, instance, validationSettings, RelationModel) {
  let relation = await RelationModel.findById(instance[validationSettings.relation.foreignKey], {
    fields: {
      id: true,
      userId: true
    }
  });

  if (!relation) {
    throw errValidation(`Relation ${RelationModel.modelName} id: ${instance[validationSettings.relation.foreignKey]} not found`);
  }

  if (validationSettings.checkOwner && !(relation.userId && relation.userId == userId)) {
    throw errAccessDenied(`Access denied for ${RelationModel.modelName} id: ${instance[validationSettings.relation.foreignKey]}`);
  }

  return true;
}
