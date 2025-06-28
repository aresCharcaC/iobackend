'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('conductores', 'usuario_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Crear índice para mejorar el rendimiento de las consultas
    await queryInterface.addIndex('conductores', ['usuario_id'], {
      name: 'conductores_usuario_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índice primero
    await queryInterface.removeIndex('conductores', 'conductores_usuario_id_idx');
    
    // Luego eliminar la columna
    await queryInterface.removeColumn('conductores', 'usuario_id');
  }
};
