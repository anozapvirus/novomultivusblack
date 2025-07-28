'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar índices para melhorar performance
    await queryInterface.addIndex('Messages', ['wid', 'companyId'], {
      name: 'idx_messages_wid_company',
      unique: false
    });

    await queryInterface.addIndex('Messages', ['createdAt'], {
      name: 'idx_messages_created_at',
      unique: false
    });

    await queryInterface.addIndex('Messages', ['ticketId', 'companyId'], {
      name: 'idx_messages_ticket_company',
      unique: false
    });

    await queryInterface.addIndex('Tickets', ['status', 'companyId'], {
      name: 'idx_tickets_status_company',
      unique: false
    });

    await queryInterface.addIndex('Tickets', ['updatedAt'], {
      name: 'idx_tickets_updated_at',
      unique: false
    });

    await queryInterface.addIndex('Tickets', ['userId', 'companyId'], {
      name: 'idx_tickets_user_company',
      unique: false
    });

    await queryInterface.addIndex('Contacts', ['number', 'companyId'], {
      name: 'idx_contacts_number_company',
      unique: false
    });

    await queryInterface.addIndex('Contacts', ['remoteJid', 'companyId'], {
      name: 'idx_contacts_remotejid_company',
      unique: false
    });

    await queryInterface.addIndex('Users', ['companyId', 'online'], {
      name: 'idx_users_company_online',
      unique: false
    });

    await queryInterface.addIndex('Whatsapps', ['companyId', 'status'], {
      name: 'idx_whatsapps_company_status',
      unique: false
    });

    await queryInterface.addIndex('Queues', ['companyId', 'ativarRoteador'], {
      name: 'idx_queues_company_router',
      unique: false
    });

    // Índices para tabelas de relacionamento
    await queryInterface.addIndex('UserQueues', ['userId', 'queueId'], {
      name: 'idx_userqueues_user_queue',
      unique: false
    });

    await queryInterface.addIndex('WhatsappQueues', ['whatsappId', 'queueId'], {
      name: 'idx_whatsappqueues_whatsapp_queue',
      unique: false
    });

    // Índices para tags
    await queryInterface.addIndex('TicketTags', ['ticketId', 'tagId'], {
      name: 'idx_tickettags_ticket_tag',
      unique: false
    });

    await queryInterface.addIndex('ContactTags', ['contactId', 'tagId'], {
      name: 'idx_contacttags_contact_tag',
      unique: false
    });

    // Índices para configurações
    await queryInterface.addIndex('Settings', ['key', 'companyId'], {
      name: 'idx_settings_key_company',
      unique: false
    });

    await queryInterface.addIndex('CompaniesSettings', ['companyId'], {
      name: 'idx_companies_settings_company',
      unique: false
    });

    // Índices para auditoria
    await queryInterface.addIndex('LogTickets', ['ticketId', 'createdAt'], {
      name: 'idx_logtickets_ticket_created',
      unique: false
    });

    await queryInterface.addIndex('ApiUsages', ['companyId', 'createdAt'], {
      name: 'idx_apiusages_company_created',
      unique: false
    });

    console.log('Índices de performance adicionados com sucesso');
  },

  down: async (queryInterface, Sequelize) => {
    // Remover índices na ordem reversa
    await queryInterface.removeIndex('ApiUsages', 'idx_apiusages_company_created');
    await queryInterface.removeIndex('LogTickets', 'idx_logtickets_ticket_created');
    await queryInterface.removeIndex('CompaniesSettings', 'idx_companies_settings_company');
    await queryInterface.removeIndex('Settings', 'idx_settings_key_company');
    await queryInterface.removeIndex('ContactTags', 'idx_contacttags_contact_tag');
    await queryInterface.removeIndex('TicketTags', 'idx_tickettags_ticket_tag');
    await queryInterface.removeIndex('WhatsappQueues', 'idx_whatsappqueues_whatsapp_queue');
    await queryInterface.removeIndex('UserQueues', 'idx_userqueues_user_queue');
    await queryInterface.removeIndex('Queues', 'idx_queues_company_router');
    await queryInterface.removeIndex('Whatsapps', 'idx_whatsapps_company_status');
    await queryInterface.removeIndex('Users', 'idx_users_company_online');
    await queryInterface.removeIndex('Contacts', 'idx_contacts_remotejid_company');
    await queryInterface.removeIndex('Contacts', 'idx_contacts_number_company');
    await queryInterface.removeIndex('Tickets', 'idx_tickets_user_company');
    await queryInterface.removeIndex('Tickets', 'idx_tickets_updated_at');
    await queryInterface.removeIndex('Tickets', 'idx_tickets_status_company');
    await queryInterface.removeIndex('Messages', 'idx_messages_ticket_company');
    await queryInterface.removeIndex('Messages', 'idx_messages_created_at');
    await queryInterface.removeIndex('Messages', 'idx_messages_wid_company');

    console.log('Índices de performance removidos');
  }
}; 