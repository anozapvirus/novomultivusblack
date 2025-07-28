import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn("QuickMessages", "folder", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "subfolder", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "contactData", {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "isContact", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "contactName", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "contactNumber", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "contactEmail", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "tags", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "usageCount", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    })
    .then(() => {
      return queryInterface.addColumn("QuickMessages", "lastUsed", {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      });
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("QuickMessages", "folder")
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "subfolder");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "contactData");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "isContact");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "contactName");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "contactNumber");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "contactEmail");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "tags");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "usageCount");
    })
    .then(() => {
      return queryInterface.removeColumn("QuickMessages", "lastUsed");
    });
  }
}; 