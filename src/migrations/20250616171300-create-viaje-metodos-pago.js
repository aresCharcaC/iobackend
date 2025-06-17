'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('viaje_metodos_pago', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      viaje_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'viajes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metodo_pago_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'metodos_pago',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices para optimizar consultas
    await queryInterface.addIndex('viaje_metodos_pago', ['viaje_id'], {
      name: 'idx_viaje_metodos_viaje_id'
    });

    await queryInterface.addIndex('viaje_metodos_pago', ['metodo_pago_id'], {
      name: 'idx_viaje_metodos_metodo_id'
    });

    // Índice único para evitar duplicados
    await queryInterface.addIndex('viaje_metodos_pago', ['viaje_id', 'metodo_pago_id'], {
      unique: true,
      name: 'idx_viaje_metodos_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('viaje_metodos_pago');
  }
};
