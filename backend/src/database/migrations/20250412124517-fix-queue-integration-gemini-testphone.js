'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar se a coluna já existe para evitar erros
    const tables = await queryInterface.showAllTables();
    if (tables.includes('QueueIntegrations')) {
      const columns = await queryInterface.describeTable('QueueIntegrations');
      
      // Se a coluna já existir, altere-a
      if (columns.geminiTestPhone) {
        return queryInterface.changeColumn('QueueIntegrations', 'geminiTestPhone', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      } 
      // Se não existir, crie-a
      else {
        return queryInterface.addColumn('QueueIntegrations', 'geminiTestPhone', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      }
    }
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('QueueIntegrations')) {
      const columns = await queryInterface.describeTable('QueueIntegrations');
      if (columns.geminiTestPhone) {
        return queryInterface.removeColumn('QueueIntegrations', 'geminiTestPhone');
      }
    }
    return Promise.resolve();
  }
};
