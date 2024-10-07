module.exports = (sequelize, DataTypes) => {
  const Test = sequelize.define(
    "test",
    {
      test_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question_file: {
        // type: DataTypes.BLOB('medium')
        type: DataTypes.STRING,
      },
      answer_file: {
        // type: DataTypes.BLOB('medium')
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      score: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
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
