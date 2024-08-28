module.exports = (sequelize, DataTypes) => {
  const LevelUpRequest = sequelize.define(
    "level_up_request",
    {
      level_up_request_id: {
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
        allowNull: false,
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
      tableName: "level_up_request",
    }
  );

  return LevelUpRequest;
};
