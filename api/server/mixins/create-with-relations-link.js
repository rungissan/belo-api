'use strict';

import Promise from 'bluebird';

import {
  errAccessDenied,
  errValidation
} from '../lib/errors';

const RELATION_LINK_HANDLERS = {
  'hasMany': linkHasMany
};

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
  Model.afterRemote('prototype.patchAttributes', setRelations(options, Model));
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

    const token = ctx.args.options && ctx.args.options.accessToken;
    let requestData = ctx.req.body || {};

    if (!(token && token.userId)) {
      return false;
    }

    return await Promise.map(options, relationOptions => {
      let relationsData = requestData[relationOptions.relationName];
      if (typeof relationsData != 'undefined') {
        let RelationModel = Model.app.models[relationOptions.relation.model];
        const handler = RELATION_LINK_HANDLERS[relationOptions.relation.type];
        return handler(token, instance, relationsData, RelationModel, relationOptions);
      }
    });
  };
}

async function linkHasMany(token, instance, relationIds, RelationModel, relationOptions) {
  let userId = token.userId;

  if (!relationIds) return Promise.resolve(true);

  if (!Array.isArray(relationIds)) {
    relationIds = [relationIds];
  }

  let relationToRemoveList = [];
  if (relationOptions.removeOldRelations) {
    let currentRelations = await instance[relationOptions.relationName]({});
    currentRelations.forEach(currentRelation => {
      if (!relationIds.includes(currentRelation.id)) {
        relationToRemoveList.push(currentRelation);
      }
    });
  }

  await Promise.map(relationIds, async relationId => {
    relationId = Number(relationId);
    if (!relationId) {
      return false;
    }

    let relationInstance =  await RelationModel.findById(relationId);

    if (!relationInstance) {
      return false;
    }

    if (relationOptions.checkOwner && !(relationInstance.userId && relationInstance.userId == userId)) {
      return false;
    }

    return await instance[relationOptions.relationName].add(relationId, null, {accessToken: token});
  });

  if (relationToRemoveList.length) {
    await Promise.map(relationToRemoveList, async relationToRemove => {
      return await instance[relationOptions.relationName].remove(relationToRemove, {accessToken: token});
    });
  }

  return instance;
}
