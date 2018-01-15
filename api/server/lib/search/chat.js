'use strict';

import BaseSearchController from './index';
const debug = require('debug')('spiti:feed:search');

const CHAT_TYPES = ['personal'];

export default class ChatSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);
  }

  queryChats(filter = {}) {
    let query = this._getChatSubquery(filter);
    query = this._getChatMessagesQuery(query);

    return this._query(query, this.replacements);
  }

  querySearchChat(filter = {}) {
    let query = this._getChatSearchSubquery(filter);
    return this._query(query, this.replacements);
  }

  _getChatSubquery(filter) {
    let where = filter.where || {};

    let selectQuery = 'SELECT "chat".*';
    selectQuery += ', COALESCE("chat_to_account_from"."lastReadedMessageId", 0) AS "lastReadedMessageId"';
    selectQuery += ', array_agg("participant".*) as "participants"';
    selectQuery += ' FROM "spiti"."chat" AS "chat"';

    selectQuery += this._joinParticipantFilterQuery(where.fromId, 'chat_to_account_from');
    selectQuery += this._joinParticipantFilterQuery(where.toId, 'chat_to_account_to');
    selectQuery += this._joinParticipantsQuery(where.toId);

    where.type && CHAT_TYPES.includes(where.type) && (selectQuery += this._typeFilterQuery(where.type));

    selectQuery += ' GROUP BY "chat"."id", "chat_to_account_from"."lastReadedMessageId"';

    return selectQuery;
  }

  _getChatSearchSubquery(filter) {
    let where = filter.where || {};

    let selectQuery = 'SELECT "chat".*, json_agg("participant".*) as "participants"';
    selectQuery += ' FROM "spiti"."chat" AS "chat"';

    selectQuery += this._joinParticipantFilterQuery(where.fromId, 'chat_to_account_from');
    selectQuery += this._joinParticipantFilterQuery(where.toId, 'chat_to_account_to');
    selectQuery += this._joinParticipantsQuery(where.toId);

    where.type && CHAT_TYPES.includes(where.type) && (selectQuery += this._typeFilterQuery(where.type));

    selectQuery += ' GROUP BY "chat"."id"';

    return selectQuery;
  }

  _getChatMessagesQuery(subQuery) {
    let query = 'SELECT "chat"."id", array_to_json("chat"."participants") AS "participants"';
    query += ', COALESCE(json_agg("message".* ORDER BY "message"."created_at" DESC) FILTER (WHERE message.id IS NOT NULL), \'[]\')';
    query += ' AS "messages"';

    query += ` FROM (${subQuery}) AS "chat"`;
    query += this._joinMessagesQuery();
    query += 'GROUP BY "chat"."id", "chat"."lastReadedMessageId", "chat"."participants";';

    return query;
  }

  _joinParticipantFilterQuery(userId, asKey) {
    if (!userId) {
      return '';
    }
    return ` INNER JOIN "spiti"."chat_to_account" AS "${asKey}" ON "${asKey}"."chatId" = "chat"."id" \n
      AND "${asKey}"."userId" = ${userId} \n
    `;
  }

  _joinParticipantsQuery(userId) {
    return `LEFT OUTER JOIN "spiti"."chat_to_account" AS "chat_to_account" ON "chat_to_account"."chatId" = "chat"."id" \n
      LEFT OUTER JOIN "spiti"."account" AS "participant" ON "chat_to_account"."userId" = "participant"."userId"`;
  }

  _joinMessagesQuery() {
    return ` LEFT OUTER JOIN "spiti"."chat_message" AS "message" ON "message"."chatId" = "chat"."id"
      AND "message"."id" > "chat"."lastReadedMessageId"`;
  }

  _typeFilterQuery(type) {
    let query = ` ${this._getJoinKey()} "chat"."type" = $${this.replacements.length + 1}`;
    this.replacements.push(type);

    return query;
  }
};
