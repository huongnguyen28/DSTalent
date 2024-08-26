module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "document",
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
      document_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      access_days: {
        type: DataTypes.INTEGER,
        defaultValue: 90,
      },
      full_content_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      preview_content_path: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "document",
    },
    {
      timestamps: true,
      createdAt: "created_at", // Alias createdAt as created_at
      updatedAt: "updated_at", // Alias updatedAt as updated_at
    }
  );

  return Document;
};
