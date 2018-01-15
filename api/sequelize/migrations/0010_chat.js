'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const chat = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  type:         { type: DataTypes.STRING(30) },
  title:        { type: DataTypes.STRING },
  imageId:      { type: DataTypes.INTEGER, references: {model: {tableName: 'attachment', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  backgroundId: { type: DataTypes.INTEGER, references: {model: {tableName: 'attachment', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  ...defaultFields(DataTypes)
});

const chat_message = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'chat', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  message: { type: DataTypes.TEXT },
  ...defaultFields(DataTypes)
});

const chat_to_account = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'chat', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  lastReadedMessageId: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'chat_message', ...BASE_SCHEMA}},
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('chat', chat(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('chat_message', chat_message(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('chat_to_account', chat_to_account(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.chat_to_account`,
        ['userId', 'chatId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({ tableName: 'chat_to_account', ...BASE_SCHEMA })
      .then(() => queryInterface.dropTable({ tableName: 'chat_message', ...BASE_SCHEMA }))
      .then(() => queryInterface.dropTable({ tableName: 'chat', ...BASE_SCHEMA }));
  }
};
