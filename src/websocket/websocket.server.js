const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
const {Usuario, Conductor} = require('../models');

class WebSocketServer{
    constructor(){
        this.io = null;
        this.connectedUsers = new Map(); // key = userId y value = socketId
        this.connectedDrivers = new Map(); // key = conductorId y value : socketId
    }
 /**
   * ✅ INICIALIZAR WEBSOCKET SERVER
   */
  
 initialize(httpServer){
    try{
        console.log(' 🕸️ Inicializando websocker server...');;
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.io.use(async (socket, next)=>{
            try{
                // Intentar obtener token de múltiples fuentes
                const token = socket.handshake.auth.token || 
                             socket.handshake.headers.authorization?.replace('Bearer ', '') ||
                             socket.handshake.query.token;
                
                console.log('🔍 Intentando autenticar WebSocket...');
                console.log('📋 Auth data:', socket.handshake.auth);
                console.log('📋 Headers:', socket.handshake.headers);
                console.log('📋 Query:', socket.handshake.query);
                
                if (!token){
                    console.log('❌ Token no proporcionado en WebSocket');
                    return next(new Error('Token no proporcionado'));
                }

                console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Manejar diferentes tipos de tokens (usuario vs conductor)
                if (decoded.conductorId) {
                    // Token de conductor
                    socket.userId = decoded.conductorId;
                    socket.userType = 'conductor';
                } else if (decoded.id) {
                    // Token de usuario
                    socket.userId = decoded.id;
                    socket.userType = decoded.type || 'usuario';
                } else {
                    throw new Error('Token no contiene ID válido');
                }
                
                console.log(`🔐 Cliente autenticado: ${socket.userType} ${socket.userId}`);
                next();

            }catch(error){
                 console.error('❌ Error autenticacion websocket:', error.message);
                 next(new Error('Token inválido'));
            }
        });

        // maneja las conexiones
        this.io.on('connection', (socket)=>{
            this.handleConnection(socket);
        });

        console.log(' ✅ websocket server inicializando correctamente');
    }catch(error){
        console.error('❌ Error incializando WebSocket: ', error.message);
        throw error;
    }
 }

//  nueva conexion a websocket

handleConnection(socket){
    try{

        // crar los rooms para pasajero y conductor con id del usuario y id del websocket
        console.log(`✅ Nueva conexion: ${socket.userType} ${socket.userId}`);
        if(socket.userType === 'usuario'){
            this.connectedUsers.set(socket.userId, socket.id);
            socket.join(`user_${socket.userId}`);
        }else if(socket.userType === 'conductor'){
            this.connectedDrivers.set(socket.userId, socket.id);
            socket.join(`driver_${socket.userId}`);
        }

        // TODOS los eventos necesarios para pasajero
        if(socket.userType === 'usuario'){
            socket.on('ride:request', (data)=> this.handleRideRequest(socket, data));
            socket.on('ride:accept_offer', (data)=> this.handleAcceptOffer(socket, data));
            socket.on('ride:reject_offer', (data)=> this.handleRejectOffer(socket, data));
            socket.on('ride:counter_offer', (data)=> this.handleCounterOffer(socket, data));
            socket.on('ride:cancel', (data)=> this.handleCancelRide(socket, data));
        }
        // TODOS los evento para conductores
        if(socket.userType === 'conductor'){
            socket.on('ride:offer', (data) => this.handleDriverOffer(socket, data));
            socket.on('ride:accept_counter', (data)=> this.handleAcceptCounter(socket, data));
            socket.on('location:update', (data)=> this.handleLocationUpdate(socket, data));
        }

        // Eventos generales

        socket.on('disconnect', ()=> this.handleDisconnection(socket) );
        socket.on('ping', ()=> socket.emit('pong'));
        
    }catch(error){
        console.error(' ❌ Error manejando conexion: ', error.message);
        socket.disconnect();
        
    }
}

// maneja la desconexiòn 

handleDisconnection(socket){
    console.log(`💀 Desconexion: ${socket.userType} ${socket.userId}`);
    if(socket.userType === 'usuario'){
        this.connectedUsers.delete(socket.userId);
    }else if(socket.userType === 'conductor'){
        this.connectedDrivers.delete(socket.userId);
    }
}

// eventos del viaje (IB)

handleRideRequest(socket, data){
    console.log(`Solicitu de viaje via websocket: `, data);
    socket.emit('ride:request_received', {success: true, data});
}

handleDriverOffer(socket, data){
    console.log(`Oferta de conductor via WebSocket: `, data);
    
    // ✅ CORREGIR: Obtener userId del viaje, no del data
    // Necesitamos buscar el viaje para obtener el usuario_id correcto
    const { Viaje } = require('../models');
    
    Viaje.findByPk(data.rideId || data.viaje_id)
        .then(viaje => {
            if (viaje) {
                console.log(`📱 Enviando oferta al usuario ${viaje.usuario_id} para viaje ${viaje.id}`);
                // ✅ CORREGIR: Usar el evento correcto 'ride:offer_received' (no 'ride:offer_reveived')
                this.notifyUser(viaje.usuario_id, 'ride:offer_received', {
                    ...data,
                    viaje_id: viaje.id,
                    usuario_id: viaje.usuario_id
                });
            } else {
                console.error(`❌ Viaje no encontrado: ${data.rideId || data.viaje_id}`);
            }
        })
        .catch(error => {
            console.error(`❌ Error buscando viaje para notificar oferta:`, error.message);
        });
}
handleAcceptOffer(socket, data){
    console.log(`Oferta aceptada via websocket: `, data);
    // notifcar al conductor
    this.notifyDriver(data.conductorId, 'ride:offer_accepted', data);
}

handleLocationUpdate(socket, data){
    console.log(` Actualizacion de ubicacoin conductor ${socket.userId}`);
}

 /**
   *  MÉTODOS DE NOTIFICACIÓN MEJORADOS
   */

  // notificar al pasajero
  notifyUser(userId, event, data){
    try {
        const room = `user_${userId}`;
        
        // ✅ AGREGAR TIMESTAMP Y METADATA
        const enrichedData = {
            ...data,
            timestamp: new Date().toISOString(),
            event_type: event,
            user_id: userId
        };
        
        console.log(`📱 Enviando evento '${event}' al usuario ${userId} en room '${room}'`);
        console.log(`📋 Datos del evento:`, JSON.stringify(enrichedData, null, 2));
        
        // Verificar si hay conexiones en el room
        const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
        console.log(`🔍 Sockets conectados en room '${room}':`, socketsInRoom ? socketsInRoom.size : 0);
        
        this.io.to(room).emit(event, enrichedData);
        console.log(`✅ Evento '${event}' enviado al usuario ${userId}`)
        
    } catch (error) {
        console.log(`❌ Error notificando usuario ${userId}: `, error.message) ;
    }
  }
  
  // notificar al conductor con información enriquecida
  notifyDriver(conductorId, event, data){
    try {
        const room = `driver_${conductorId}`;
        
        // ✅ AGREGAR TIMESTAMP Y METADATA PARA CONDUCTORES
        const enrichedData = {
            ...data,
            timestamp: new Date().toISOString(),
            event_type: event,
            conductor_id: conductorId,
            // ✅ INFORMACIÓN ADICIONAL PARA SOLICITUDES
            ...(event === 'ride:new_request' && {
                notification_priority: 'high',
                requires_response: true,
                expires_at: new Date(Date.now() + (data.timeout_segundos * 1000)).toISOString()
            })
        };
        
        this.io.to(room).emit(event, enrichedData);
        console.log(`🚗 Notificación enviada a conductor ${conductorId}: ${event}`); 
    } catch (error) {
        console.error(`❌ Error notificando al conductor ${conductorId}: `, error.message);
    }
  }

  // ✅ NUEVO MÉTODO PARA NOTIFICAR SOLICITUD CON INFORMACIÓN COMPLETA
  notifyDriverNewRequest(conductorId, requestData){
    try {
        const room = `driver_${conductorId}`;
        
        // ✅ ESTRUCTURA COMPLETA PARA EL CONDUCTOR
        const completeRequestData = {
            event_type: 'ride:new_request',
            timestamp: new Date().toISOString(),
            conductor_id: conductorId,
            notification_priority: 'high',
            requires_response: true,
            expires_at: new Date(Date.now() + (requestData.timeout_segundos * 1000)).toISOString(),
            
            // ✅ DATOS DEL VIAJE
            viaje: {
                id: requestData.viaje_id,
                origen: requestData.origen,
                destino: requestData.destino,
                distancia_km: requestData.distancia_km,
                tiempo_estimado: requestData.tiempo_estimado,
                distancia_conductor: requestData.distancia_conductor
            },
            
            // ✅ INFORMACIÓN DEL USUARIO (si está disponible)
            usuario: requestData.usuario || {
                nombre: 'Usuario',
                foto: null,
                rating: 0.0
            },
            
            // ✅ INFORMACIÓN DE PRECIOS
            precios: {
                usuario_pide: requestData.precio_sugerido,
                app_sugiere: requestData.precio_sugerido_app || requestData.precio_sugerido,
                moneda: 'PEN'
            },
            
            // ✅ MÉTODOS DE PAGO
            metodos_pago: requestData.metodos_pago || [],
            
            // ✅ CONFIGURACIÓN DE TIMEOUT
            timeout_segundos: requestData.timeout_segundos,
            
            // ✅ ACCIONES DISPONIBLES
            acciones: {
                puede_ofertar: true,
                tiempo_para_ofertar: requestData.timeout_segundos
            }
        };
        
        this.io.to(room).emit('ride:new_request', completeRequestData);
        console.log(`🎯 Solicitud completa enviada a conductor ${conductorId}`);
        
    } catch (error) {
        console.error(`❌ Error enviando solicitud completa al conductor ${conductorId}: `, error.message);
    }
  }

  notifyMultipleDrivers(conductorIds, event, data){
    try {
        conductorIds.forEach(conductorId =>{
            this.notifyDriver(conductorId, event, data);
        });
        console.log(`📡 Notificación broadcast a ${conductorIds.length} conductores: ${event}`);
    } catch (error) {
        console.error(' ❌ Error en notificación múltiple', error.message);
    }
  }
  
  // estadistica adicionales

  getStats(){
    return{
        connectedUsers: this.connectedUsers.size,
        connectedDrivers: this.connectedDrivers.size,
        totalConectios: this.connectedUsers.size + this.connectedDrivers.size,
        timestamp: new Date()
    };
  }

  getIO(){
    return this.io;
  }
}

module.exports = new WebSocketServer()
