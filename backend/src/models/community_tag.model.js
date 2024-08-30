const { community } = require("../configs/db");

module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    "community_tag",
    {
      community_tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      community_id: {
        type: DataTypes.INTEGER,
        // primaryKey: true,
        allowNull: false,
      },
      tag_id: {
        type: DataTypes.INTEGER,
        // primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: "community_tag",
    }
  );

  return Tag;
};
