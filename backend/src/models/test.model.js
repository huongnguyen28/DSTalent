module.exports = (sequelize, DataTypes) => {
  const Test = sequelize.define(
    "test",
    {
      test_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question_file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      answer_file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      problem_phase: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      duration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      up_level_request_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
    },
    {
      tableName: "test",
    },
    {
      timestamps: true,
      createdAt: "created_at", // Alias createdAt as created_at
      updatedAt: "updated_at", // Alias updatedAt as updated_at
    }
  );

  return Test;
};
