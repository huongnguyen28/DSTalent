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
      score: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      num_judge_agreed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      num_judge_completed_question: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      num_judge_completed_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "up_level_request",
    }
  );

  return UpLevelRequest;
};
