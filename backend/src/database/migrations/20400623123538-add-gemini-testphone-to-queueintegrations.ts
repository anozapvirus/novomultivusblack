import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("QueueIntegrations", "geminiTestPhone", {
      type: DataTypes.STRING(100),
      allowNull: true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("QueueIntegrations", "geminiTestPhone");
  }
}; 