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
    query += this._addOrder();
    return this._query(query, this.replacements);
  }

  _addOrder() {
    let query = ` ORDER BY "last"->>'updated_at' DESC NULLS LAST; `;
    return query;
  }

  querySearchChat(filter = {}) {
    let query = this._getChatSearchSubquery(filter);
    return this._query(query, this.replacements);
  }

  _getChatSubquery(filter) {
    let where = filter.where || {};

    let selectQuery = 'SELECT "chat".*';
    selectQuery += ', COALESCE("chat_to_account_from"."lastReadedMessageId", 0) AS "lastReadedMessageId"';
    selectQuery += `, jsonb_agg(
        json_build_object( \
          'id', "participant"."userId", \
          'firstName', "participant"."firstName", \
          'lastName', "participant"."lastName", \
          'userName', "participant"."userName", \
          'brokerage', "participant"."brokerage", \
          'avatar', json_build_object( \
            'id', "avatar"."id", \
            'publicUrl', "avatar"."publicUrl", \
            'name', "avatar"."name", \
            'sizes', "avatar"."sizes" \
          ) \
        ) \
      ) AS "participants"`;
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

    let selectQuery = 'SELECT "chat".*, jsonb_agg("participant".*) as "participants"';
    selectQuery += ' FROM "spiti"."chat" AS "chat"';

    selectQuery += this._joinParticipantFilterQuery(where.fromId, 'chat_to_account_from');
    selectQuery += this._joinParticipantFilterQuery(where.toId, 'chat_to_account_to');
    selectQuery += this._joinParticipantsQuery(where.toId);

    where.type && CHAT_TYPES.includes(where.type) && (selectQuery += this._typeFilterQuery(where.type));

    selectQuery += ' GROUP BY "chat"."id"';

    return selectQuery;
  }

  _getChatMessagesQuery(subQuery) {
    let query = 'SELECT "chat"."id", "chat"."participants" AS "participants"';
    query += ', COALESCE(json_agg("message".* ORDER BY "message"."created_at" DESC) FILTER (WHERE message.id IS NOT NULL), \'[]\')';
    query += ' AS "messages", "lastMessage"."last" ';

    query += ` FROM (${subQuery}) AS "chat"`;
    query += this._joinMessagesQuery();
    query += this._joinLastMessagesQuery();
    query += ' GROUP BY "chat"."id", "chat"."lastReadedMessageId", "chat"."participants", "lastMessage"."last"';

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
      LEFT OUTER JOIN "spiti"."account" AS "participant" ON "chat_to_account"."userId" = "participant"."userId" \n
      LEFT OUTER JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "participant"."avatarId"`;
  }

  _joinMessagesQuery() {
    return ` LEFT OUTER JOIN "spiti"."chat_message" AS "message" ON "message"."chatId" = "chat"."id"
      AND "message"."id" > "chat"."lastReadedMessageId" `;
  }
  _joinLastMessagesQuery() {
    return `
    LEFT JOIN LATERAL (
      SELECT jsonb_build_object(
        'id', "lastMessage"."id", 
        'message', "lastMessage"."message", 
        'updated_at', "lastMessage"."updated_at"
      ) AS "last"
      FROM "spiti"."chat_message" AS "lastMessage"
      WHERE "lastMessage"."chatId" = "chat"."id"
      ORDER BY "lastMessage"."created_at" DESC
      LIMIT 1
     ) 
    "lastMessage" ON "message"."id" IS NULL`;
  }

  _typeFilterQuery(type) {
    let query = ` ${this._getJoinKey()} "chat"."type" = $${this.replacements.length + 1}`;
    this.replacements.push(type);

    return query;
  }
};
