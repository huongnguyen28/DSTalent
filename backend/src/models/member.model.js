module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define(
    "member",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      community_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      up_level_phase: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_up_level_request_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      is_joined: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "member",
    }
  );

  return Member;
};
