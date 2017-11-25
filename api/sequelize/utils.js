
export const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  };
};

export const CASCADE_RULES = { onUpdate: 'cascade', onDelete: 'cascade'};

export const BASE_SCHEMA  = { schema: 'spiti' };
export const AUTH_SCHEMA = { schema: 'auth' };
