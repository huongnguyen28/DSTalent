module.exports = (sequelize, DataTypes) => {
  const DocumentAccess = sequelize.define(
    "document_access",
    {
      document_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      document_access_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      purchase_date: {
        type: DataTypes.DATE,
        defaultValue: Date.now(),
      },
      price_paid: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      expired_date: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      tableName: "document_access",
    }
  );

  return DocumentAccess;
};
