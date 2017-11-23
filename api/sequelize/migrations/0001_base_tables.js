'use strict';

const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  }
};

const cascadeRules = { onUpdate: 'cascade', onDelete: 'cascade'};

const user = (DataTypes) => ({
  id:                { type: DataTypes.INTEGER,     allowNull: false, primaryKey: true, autoIncrement: true },
  // firstname:         { type: DataTypes.STRING(100) },
  // lastname:          { type: DataTypes.STRING(100) },
  username:          { type: DataTypes.STRING(100) },
  email:             { type: DataTypes.STRING,      allowNull: false, unique: true },
  realm:             { type: DataTypes.STRING },
  password:          { type: DataTypes.STRING,      allowNull: false },
  verificationtoken: { type: DataTypes.STRING },
  // description:       { type: DataTypes.STRING },
  emailverified:     { type: DataTypes.BOOLEAN },
  ...defaultFields(DataTypes)
});

const account = (DataTypes) => ({
  userid: { type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {model: 'user', key: 'id'},
    ...cascadeRules
  },
  type:               { type: DataTypes.STRING(20) },
  first_name:         { type: DataTypes.STRING(30) },
  last_name:          { type: DataTypes.STRING(30) },
  username:           { type: DataTypes.STRING(30) },
  phone:              { type: DataTypes.STRING(30) },
  about:              { type: DataTypes.TEXT },
  biography:          { type: DataTypes.TEXT },
  brokerage:          { type: DataTypes.STRING(100) },
  license_type:       { type: DataTypes.STRING(50) },
  license_state:      { type: DataTypes.STRING(4) },
  license_number:     { type: DataTypes.INTEGER },
  license_expiration: { type: DataTypes.DATE },
  avatar_id:     { type: DataTypes.INTEGER, references: {model: 'attachment', key: 'id'}, ...cascadeRules },
  background_id: { type: DataTypes.INTEGER, references: {model: 'attachment', key: 'id'}, ...cascadeRules },
  ...defaultFields(DataTypes)
});

const accesstoken = (DataTypes) => ({
  id:      { type: DataTypes.TEXT,    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 1209600 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: 'user', key: 'id'},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
});

const verifytoken = (DataTypes) => ({
  id:      { type: DataTypes.STRING(20),    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 900 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: 'user', key: 'id'},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
});

const acl = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  model:         { type: DataTypes.STRING(50) },
  property:      { type: DataTypes.STRING },
  accesstype:    { type: DataTypes.STRING },
  permission:    { type: DataTypes.STRING },
  principaltype: { type: DataTypes.STRING },
  principalid:   { type: DataTypes.STRING }
});

const role = (DataTypes) => ({
  id:          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.STRING(100) },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
});

const rolemapping = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  principaltype: { type: DataTypes.TEXT },
  principalid:   { type: DataTypes.TEXT },
  roleid:        { type: DataTypes.INTEGER }
});

const attachment = (DataTypes) => ({
  id:             { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userid:         { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
  url:            { type: DataTypes.STRING },
  public_url:     { type: DataTypes.STRING },
  type:           { type: DataTypes.STRING(20) },
  size:           { type: DataTypes.INTEGER },
  name:           { type: DataTypes.STRING },
  container:      { type: DataTypes.STRING },
  container_root: { type: DataTypes.STRING },
  public:         { type: DataTypes.BOOLEAN, defaultValue: true },
  sizes:          { type: DataTypes.JSONB }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('user', user(DataTypes))
      .then(() => queryInterface.createTable('accesstoken', accesstoken(DataTypes)))
      .then(() => queryInterface.createTable('verification_token', verifytoken(DataTypes)))
      .then(() => queryInterface.createTable('acl', acl(DataTypes)))
      .then(() => queryInterface.createTable('role', role(DataTypes)))
      .then(() => queryInterface.createTable('rolemapping', rolemapping(DataTypes)))
      .then(() => queryInterface.createTable('attachment', attachment(DataTypes)))
      .then(() => queryInterface.createTable('account', account(DataTypes)))
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('user')
      .then(() => queryInterface.dropTable('account'))
      .then(() => queryInterface.dropTable('accesstoken'))
      .then(() => queryInterface.dropTable('verification_token'))
      .then(() => queryInterface.dropTable('acl'))
      .then(() => queryInterface.dropTable('role'))
      .then(() => queryInterface.dropTable('rolemapping'))
      .then(() => queryInterface.dropTable('attachment'));
  }
};
