module.exports = (sequelize, DataTypes) => {
  const UpLevelRequest = sequelize.define(
    "up_level_request",
    {
      up_level_request_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      candidate_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      candidate_target_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      agreed_judge: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "up_level_request",
    }
  );

  return UpLevelRequest;
};
