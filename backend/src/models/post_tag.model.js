module.exports = (sequelize, DataTypes) => {
    const PostTag = sequelize.define(
      "post_tag",
      {
        post_tag_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        post_id: {
          type: DataTypes.STRING,
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
        tableName: "post_tag",
      }
    );
    return PostTag;
};