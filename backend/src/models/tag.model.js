module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    "tag",
    {
      tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tag_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "tag",
    }
  );

  return Tag;
};
