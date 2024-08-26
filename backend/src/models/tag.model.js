module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    "tag",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      global_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "tag",
    }
  );

  return Tag;
};
