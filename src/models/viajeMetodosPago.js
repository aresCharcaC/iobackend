'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ViajeMetodosPago extends Model {
    static associate(models) {
      ViajeMetodosPago.belongsTo(models.Viaje, {
        foreignKey: 'viaje_id',
        as: 'viaje'
      });
      
      ViajeMetodosPago.belongsTo(models.MetodoPago, {
        foreignKey: 'metodo_pago_id',
        as: 'metodoPago'
      });
    }
  }

  ViajeMetodosPago.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    viaje_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    metodo_pago_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ViajeMetodosPago',
    tableName: 'viaje_metodos_pago',
    timestamps: true
  });

  return ViajeMetodosPago;
};
