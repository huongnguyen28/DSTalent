module.exports = (sequelize, DataTypes) => {
    const UpLevelRequestJudge = sequelize.define(
      "up_level_request_judge",
      {
        up_level_request_judge_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        up_level_request_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        member_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        tableName: "up_level_request_judge",
        indexes: [
          {
            unique: true,
            fields: ['up_level_request_id', 'member_id'],
          },
        ],
      }
    );
  
    return UpLevelRequestJudge;
  };
  