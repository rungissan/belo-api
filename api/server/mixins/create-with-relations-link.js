'use strict';

import Promise from 'bluebird';

import {
  errAccessDenied,
  errValidation
} from '../lib/errors';

const RELATION_LINK_HANDLERS = {
  'hasMany': linkHasMany
};

// TODO: implement update hooks hanlde
/**
 * @desc Mixin that add relations into database after model create.
 * @param {Object} Model loopback model.
 * @param {Object} options mixin options
 * @property {Object} relationName name of relation to validate
 */
export default function(Model, minixOptions = {}) {
  let options = Object.keys(minixOptions)
    .map(key => {
      return {
        relationName: key,
        ...minixOptions[key]
      };
    });

  if (!options.length) {
    return;
  }

  options = options.map(linkOptions => getRelationLinkSettings(linkOptions, Model));
  Model.afterRemote('create', setRelations(options, Model));
};

function getRelationLinkSettings(validationSettings, Model) {
  const { relationName } = validationSettings;

  let Relation;
  let relations = Model.definition.settings.relations;

  let relation = relations[relationName];

  if (!relation) {
    throw new Error(`Relation ${relationName} not found`);
  }

  if (!RELATION_LINK_HANDLERS[relation.type]) {
    throw new Error(`Relation type ${relation.type} not supported`);
  }

  validationSettings.relation = relation;
  return validationSettings;
}

function setRelations(options, Model) {
  return async function(ctx, instance) {
    if (!instance) {
      return;
    }

    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;
    let requestData = ctx.req.body || {};

    options.forEach(relationOptions => {

    });

    return await Promise.map(options, relationOptions => {
      let relationsData = requestData[relationOptions.relationName];
      if (typeof relationsData != 'undefined') {
        let RelationModel = Model.app.models[relationOptions.relation.model];
        const handler = RELATION_LINK_HANDLERS[relationOptions.relation.type];
        return handler(userId, instance, relationsData, RelationModel, relationOptions);
      }
    });
  };
}

async function linkHasMany(userId, instance, relationIds, RelationModel, relationOptions) {
  if (!relationIds) return Promise.resolve(true);

  if (!Array.isArray(relationIds)) {
    relationIds = [relationIds];
  }

  return await Promise.map(relationIds, async relationId => {
    if (typeof relationId != 'number') {
      return false;
    }

    let relationInstance =  await RelationModel.findById(relationId);

    if (!relationInstance) {
      return false;
    }

    if (relationOptions.checkOwner && !(relationInstance.userId && relationInstance.userId == userId)) {
      return false;
    }

    return await instance[relationOptions.relationName].add(relationId);
  });
}
