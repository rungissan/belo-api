'use strict';

// oauth tables
const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  };
};
const cascadeRules = { onUpdate: 'cascade', onDelete: 'cascade'};

// TODO: Add relation to listings
const post = (DataTypes) => ({
  id:          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user', key: 'id' }, ...cascadeRules },
  title:       { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  image_id:    { type: DataTypes.INTEGER, references: {model: 'attachment', key: 'id'}, ...cascadeRules },
  // listing_id:  { type: DataTypes.INTEGER, references: {model: 'listing', key: 'id'}, ...cascadeRules },
  ...defaultFields(DataTypes)
});

const attachment_to_post = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachment_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'attachment', key: 'id' }, ...cascadeRules},
  post_id:       { type: DataTypes.INTEGER, allowNull: false, references: { model: 'post', key: 'id' }, ...cascadeRules }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('post', post(DataTypes))
      .then(() => queryInterface.createTable('attachment_to_post', attachment_to_post(DataTypes)));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('attachment_to_post')
      .then(() => queryInterface.dropTable('post'));
  }
};
