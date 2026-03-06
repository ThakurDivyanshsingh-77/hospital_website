const { DataTypes, Model } = require("sequelize");
const { getSequelize } = require("../config/db");

class GalleryItem extends Model {}

GalleryItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(1200),
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    uploadedById: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: "GalleryItem",
    tableName: "gallery_items",
    timestamps: true,
    indexes: [
      { fields: ["isActive"] },
      { fields: ["uploadedById"] },
    ],
  }
);

module.exports = GalleryItem;
