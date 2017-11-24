
export const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  };
};

export const cascadeRules = { onUpdate: 'cascade', onDelete: 'cascade'};
