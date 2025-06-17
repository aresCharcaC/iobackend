const { Viaje, OfertaViaje } = require('./src/models');

async function fixActiveRide() {
  try {
    console.log('🔧 Iniciando corrección del viaje activo...');
    
    const rideId = 'e83c7eb9-55bc-44f8-b2f9-e839231e6d19';
    const userId = '25a644e8-4414-486a-bcee-d69518374313';
    
    console.log(`🔍 Buscando viaje ${rideId}...`);
    
    // Buscar el viaje problemático
    const viaje = await Viaje.findByPk(rideId);
    
    if (!viaje) {
      console.log('❌ Viaje no encontrado');
      return;
    }
    
    console.log(`📊 Viaje encontrado:`);
    console.log(`   - ID: ${viaje.id}`);
    console.log(`   - Usuario: ${viaje.usuario_id}`);
    console.log(`   - Estado: ${viaje.estado}`);
    console.log(`   - Fecha solicitud: ${viaje.fecha_solicitud}`);
    console.log(`   - Origen: ${viaje.origen_direccion}`);
    console.log(`   - Destino: ${viaje.destino_direccion}`);
    
    // Verificar ofertas relacionadas
    const ofertas = await OfertaViaje.findAll({
      where: { viaje_id: rideId }
    });
    
    console.log(`📋 Ofertas encontradas: ${ofertas.length}`);
    
    if (ofertas.length > 0) {
      console.log('🗑️ Eliminando ofertas relacionadas...');
      await OfertaViaje.destroy({
        where: { viaje_id: rideId }
      });
      console.log(`✅ ${ofertas.length} ofertas eliminadas`);
    }
    
    // Eliminar el viaje
    console.log('🗑️ Eliminando viaje...');
    await viaje.destroy();
    console.log('✅ Viaje eliminado exitosamente');
    
    // Verificar que no hay más viajes activos para este usuario
    const viajesActivos = await Viaje.findAll({
      where: {
        usuario_id: userId,
        estado: ['solicitado', 'ofertas_recibidas', 'aceptado', 'en_curso']
      }
    });
    
    console.log(`📊 Viajes activos restantes para usuario ${userId}: ${viajesActivos.length}`);
    
    if (viajesActivos.length > 0) {
      console.log('⚠️ Aún hay viajes activos:');
      viajesActivos.forEach(v => {
        console.log(`   - ${v.id}: ${v.estado} (${v.fecha_solicitud})`);
      });
    } else {
      console.log('✅ No hay más viajes activos para este usuario');
    }
    
    console.log('🎉 Corrección completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la corrección
fixActiveRide();
