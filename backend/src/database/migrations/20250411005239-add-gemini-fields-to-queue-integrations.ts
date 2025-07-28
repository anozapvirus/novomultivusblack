import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QueueIntegrations", "geminiApiKey", {
        type: DataTypes.STRING,
        allowNull: true
      }),
      
      queryInterface.addColumn("QueueIntegrations", "geminiPrompt", {
        type: DataTypes.TEXT,
        allowNull: true
      }),
      
      queryInterface.addColumn("QueueIntegrations", "geminiMaxTokens", {
        type: DataTypes.INTEGER,
        defaultValue: 1024,
        allowNull: true
      }),
      
      queryInterface.addColumn("QueueIntegrations", "geminiTemperature", {
        type: DataTypes.FLOAT,
        defaultValue: 0.7,
        allowNull: true
      }),
      
      queryInterface.addColumn("QueueIntegrations", "geminiMaxMessages", {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QueueIntegrations", "geminiApiKey"),
      queryInterface.removeColumn("QueueIntegrations", "geminiPrompt"),
      queryInterface.removeColumn("QueueIntegrations", "geminiMaxTokens"),
      queryInterface.removeColumn("QueueIntegrations", "geminiTemperature"),
      queryInterface.removeColumn("QueueIntegrations", "geminiMaxMessages")
    ]);
  }
}; 