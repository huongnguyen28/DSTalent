module.exports = (sequelize, DataTypes) => {
  const BasicTestSubmit = sequelize.define(
    "basic_test_submit",
    {
      basic_test_submit_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      basic_test_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "basic_test_submit",
    }
  );

  return BasicTestSubmit;
};
