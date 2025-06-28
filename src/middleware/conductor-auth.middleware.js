const { verifyToken } = require('../auth/auth.util');
const { Conductor } = require('../models');
const { authenticateAccessToken } = require('./auth.middleware');
const { Op } = require('sequelize');

async function authenticateConductorCredentials(req, res, next) {
  try {
    // Primero autenticar como usuario normal usando el middleware existente
    let userAuthenticated = false;
    let authError = null;
    
    // Crear un middleware wrapper para capturar el resultado
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          authError = { code, data };
          return mockRes;
        }
      })
    };
    
    const mockNext = () => {
      userAuthenticated = true;
    };
    
    await authenticateAccessToken(req, mockRes, mockNext);
    
    if (!userAuthenticated || !req.user) {
      console.log('❌ Usuario no autenticado para conductor:', authError);
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        hint: 'Debe iniciar sesión como usuario primero',
        type: 'user_not_authenticated',
        authError: authError
      });
    }
    
    // El usuario está autenticado, ahora verificar si tiene perfil de conductor
    console.log('🔍 Verificando perfil de conductor para usuario:', req.user.id);
    console.log('👤 Datos de usuario:', {
      id: req.user.id,
      nombre: req.user.nombre,
      telefono: req.user.telefono,
      tipo: req.user.tipo
    });
    
    // Buscar conductor por ID de usuario
    const conductor = await Conductor.findOne({ 
      where: { usuario_id: req.user.id },
      attributes: ['id', 'nombre_completo', 'telefono', 'estado', 'dni', 'usuario_id']
    });
    
    if (!conductor) {
      console.log('❌ No se encontró perfil de conductor para usuario:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'El usuario no tiene perfil de conductor',
        hint: 'Debe registrarse como conductor primero',
        type: 'conductor_profile_not_found',
        debug: {
          userId: req.user.id,
          userName: req.user.nombre
        }
      });
    }
    
    console.log('✅ Perfil de conductor encontrado:', {
      id: conductor.id,
      nombre: conductor.nombre_completo,
      estado: conductor.estado
    });
    
    if (conductor.estado !== 'activo') {
      console.log('❌ Conductor no activo:', conductor.estado);
      return res.status(403).json({
        success: false,
        message: 'Perfil de conductor no activo',
        estado: conductor.estado,
        type: 'conductor_not_active',
        hint: conductor.estado === 'pendiente' 
          ? 'Su cuenta está pendiente de aprobación' 
          : conductor.estado === 'rechazado'
          ? 'Su cuenta ha sido rechazada. Contacte al administrador'
          : conductor.estado === 'suspendido'
          ? 'Su cuenta está suspendida. Contacte al administrador'
          : 'Contacte al administrador'
      });
    }
    
    // Agregar información de conductor al request
    req.user.conductorId = conductor.id;
    req.user.tipo = 'conductor';
    req.user.nombre = conductor.nombre_completo || req.user.nombre;
    req.user.telefono = conductor.telefono || req.user.telefono;
    req.user.dni = conductor.dni || req.user.dni;
    req.user.estadoConductor = conductor.estado;
    
    // Agregar objeto conductor completo para fácil acceso
    req.conductor = {
      id: conductor.id,
      nombre_completo: conductor.nombre_completo,
      telefono: conductor.telefono,
      estado: conductor.estado,
      dni: conductor.dni,
      usuario_id: conductor.usuario_id
    };
    
    console.log(`✅ Conductor autenticado: ${conductor.id} - ${conductor.nombre_completo} (Estado: ${conductor.estado})`);
    next();
  } catch (error) {
    console.error('❌ Error en authenticateConductorCredentials:', error);
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Mantener el método original para compatibilidad, pero redirigir al nuevo
const authenticateConductorToken = authenticateConductorCredentials;

module.exports = {
  authenticateConductorCredentials,
  authenticateConductorToken
};
