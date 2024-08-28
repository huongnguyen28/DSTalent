module.exports = (sequelize, DataTypes) => {
  const BasicTest = sequelize.define(
    "basic_test",
    {
      basic_test_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      community_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      content: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
    },
    {
      tableName: "basic_test",
    },
    {
      timestamps: true,
      createdAt: "created_at", // Alias createdAt as created_at
      updatedAt: "updated_at", // Alias updatedAt as updated_at
    }
  );

  return BasicTest;
};
