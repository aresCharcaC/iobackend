'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('viajes', 'precio_sugerido', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Precio sugerido por la aplicación basado en distancia y demanda'
    });

    await queryInterface.addColumn('viajes', 'usuario_rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Rating del usuario que solicita el viaje (0-5)'
    });

    await queryInterface.addColumn('viajes', 'usuario_nombre', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Nombre del usuario para mostrar al conductor'
    });

    await queryInterface.addColumn('viajes', 'usuario_foto', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL de la foto de perfil del usuario'
    });

    // Agregar índices para optimizar consultas
    await queryInterface.addIndex('viajes', ['estado', 'fecha_solicitud'], {
      name: 'idx_viajes_estado_fecha'
    });

    await queryInterface.addIndex('viajes', ['origen_lat', 'origen_lng'], {
      name: 'idx_viajes_origen_coords'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('viajes', 'idx_viajes_origen_coords');
    await queryInterface.removeIndex('viajes', 'idx_viajes_estado_fecha');
    
    await queryInterface.removeColumn('viajes', 'usuario_foto');
    await queryInterface.removeColumn('viajes', 'usuario_nombre');
    await queryInterface.removeColumn('viajes', 'usuario_rating');
    await queryInterface.removeColumn('viajes', 'precio_sugerido');
  }
};
