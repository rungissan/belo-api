'use strict';

const Promise = require('bluebird');

const VALIDATION_HANDLERS = {
  'belongsTo': validateBelongsTo
};

export default function(Model, options = {}) {
  let settings = Object.keys(options)
    .map(key => {
      return {
        modelName: key,
        type: options[key].type,
        foreignKey: options[key].foreignKey
      };
    });

  if (!settings.length) {
    return;
  }

  settings = settings.map(relationSettings => getRelationSettings(relationSettings, Model));

  Model.observe('before save', validateRelations(settings, Model));
};

const ALLOWED_RELATION_TYPES = ['belongsTo'];

function getRelationSettings(relationSettings, Model) {
  const { modelName, type, foreignKey } = relationSettings;

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
  return relation;
}

function validateRelations(settings, Model) {
  return async function(ctx) {
    if (!ctx.instance || ctx.instance.id) {
      return;
    }

    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;

    await Promise.map(settings, relationSettings => {
      let RelationModel = Model.app.models[relationSettings.model];
      return VALIDATION_HANDLERS[relationSettings.type](userId, ctx.instance, relationSettings, RelationModel);
    });
  };
}

async function validateBelongsTo(userId, instance, relationSettings, RelationModel) {
  let relation = await RelationModel.findById(instance[relationSettings.foreignKey], {
    fields: {
      id: true,
      userId: true
    }
  });

  if (!relation) {
    throw new Error('Relation not found');
  }

  if (!(relation.userId && relation.userId == userId)) {
    throw new Error('Access denied');
  }

  return true;
}
