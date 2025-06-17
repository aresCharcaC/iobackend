# 💰 SISTEMA DE PRECIOS INTELIGENTE - JOYA EXPRESS

## Resumen

Se ha implementado un sistema de cálculo de precios sugeridos simple y eficiente basado en la fórmula solicitada:

**FÓRMULA: S/. 3.00 base + S/. 1.00 por kilómetro**

## 📋 Características Implementadas

### ✅ Fórmula Simple
- **Precio Base**: S/. 3.00 soles
- **Precio por Kilómetro**: S/. 1.00 sol
- **Precio Mínimo**: S/. 3.00 soles
- **Precio Máximo**: S/. 200.00 soles

### ✅ Configuración Centralizada
- Archivo: `src/config/pricing.config.js`
- Fácil modificación de parámetros
- Funciones reutilizables para cálculos

### ✅ Integración Completa
- Servicio de rides actualizado
- Controlador con endpoint de estimación
- Rutas configuradas
- Logs informativos

## 🛠️ Archivos Modificados/Creados

### Nuevos Archivos
1. **`src/config/pricing.config.js`** - Configuración centralizada de precios
2. **`PRICING_SYSTEM.md`** - Esta documentación

### Archivos Modificados
1. **`src/rides/rides.service.redesigned.js`** - Integración con configuración de precios
2. **`src/rides/rides.controller.js`** - Nuevo endpoint de estimación
3. **`src/rides/rides.routes.js`** - Nueva ruta para estimación

## 🚀 Endpoints Disponibles

### 1. Estimación de Precio (Nuevo)
```http
GET /api/rides/price-estimate?origen_lat=-12.0464&origen_lng=-77.0428&destino_lat=-12.0564&destino_lng=-77.0528
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Precio estimado calculado exitosamente",
  "data": {
    "precio_sugerido": 5.50,
    "precio_base": 3.0,
    "precio_por_km": 1.0,
    "distancia_km": 2.5,
    "tiempo_estimado_minutos": 6,
    "formula": "S/. 3 base + 2.50 km × S/. 1 = S/. 5.5",
    "limites": {
      "minimo": 3.0,
      "maximo": 200.0
    },
    "coordenadas": {
      "origen": { "lat": -12.0464, "lng": -77.0428 },
      "destino": { "lat": -12.0564, "lng": -77.0528 }
    },
    "calculado_en": "2025-06-16T21:28:00.000Z"
  }
}
```

### 2. Crear Solicitud de Viaje (Mejorado)
```http
POST /api/rides/request
```

Ahora incluye el precio sugerido calculado automáticamente usando la nueva fórmula.

## 📊 Ejemplos de Cálculo

| Distancia | Cálculo | Precio Final |
|-----------|---------|--------------|
| 1.0 km    | S/. 3.00 + (1.0 × S/. 1.00) | S/. 4.00 |
| 2.5 km    | S/. 3.00 + (2.5 × S/. 1.00) | S/. 5.50 |
| 5.0 km    | S/. 3.00 + (5.0 × S/. 1.00) | S/. 8.00 |
| 10.0 km   | S/. 3.00 + (10.0 × S/. 1.00) | S/. 13.00 |
| 15.0 km   | S/. 3.00 + (15.0 × S/. 1.00) | S/. 18.00 |

## ⚙️ Configuración

### Modificar Precios
Para cambiar los precios, edita el archivo `src/config/pricing.config.js`:

```javascript
const PRICING_CONFIG = {
  PRECIO_BASE: 3.0,           // Cambiar precio base
  PRECIO_POR_KM: 1.0,         // Cambiar precio por km
  PRECIO_MINIMO: 3.0,         // Precio mínimo
  PRECIO_MAXIMO: 200.0,       // Precio máximo
  // ... otros parámetros
};
```

### Funciones Disponibles
```javascript
const { 
  calcularPrecioSugerido,     // Calcular precio para una distancia
  calcularTiempoEstimado,     // Calcular tiempo estimado
  obtenerInfoPrecios          // Información completa de precios
} = require('../config/pricing.config');

// Ejemplo de uso
const precio = calcularPrecioSugerido(5.2); // S/. 8.20
const tiempo = calcularTiempoEstimado(5.2);  // 13 minutos
const info = obtenerInfoPrecios(5.2);        // Información completa
```

## 🔍 Logs del Sistema

El sistema genera logs informativos cuando calcula precios:

```
💰 Precio calculado: S/. 3 base + 2.50 km × S/. 1 = S/. 5.5
💰 Estimación de precio: S/. 3 base + 2.50 km × S/. 1 = S/. 5.5
```

## 🚫 Características NO Implementadas

Como se solicitó mantener simplicidad, NO se implementaron:

- ❌ Precios dinámicos por zona
- ❌ Precios por hora pico/demanda
- ❌ Configuración compleja de tarifas
- ❌ Multiplicadores por condiciones especiales

## 🧪 Testing

### Probar Estimación de Precio
```bash
# Ejemplo con coordenadas de Lima
curl "http://localhost:3000/api/rides/price-estimate?origen_lat=-12.0464&origen_lng=-77.0428&destino_lat=-12.0564&destino_lng=-77.0528"
```

### Probar Creación de Viaje
```bash
curl -X POST http://localhost:3000/api/rides/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "origen_lat": -12.0464,
    "origen_lng": -77.0428,
    "destino_lat": -12.0564,
    "destino_lng": -77.0528,
    "origen_direccion": "Miraflores, Lima",
    "destino_direccion": "San Isidro, Lima"
  }'
```

## 📈 Beneficios del Sistema

1. **Simplicidad**: Fórmula fácil de entender y calcular
2. **Transparencia**: Los usuarios ven exactamente cómo se calcula el precio
3. **Consistencia**: Mismo cálculo en toda la aplicación
4. **Mantenibilidad**: Configuración centralizada y fácil de modificar
5. **Performance**: Cálculos rápidos sin complejidad innecesaria

## 🔧 Mantenimiento

### Cambiar Precios
1. Editar `src/config/pricing.config.js`
2. Reiniciar el servidor
3. Los nuevos precios se aplicarán inmediatamente

### Monitoreo
- Los logs muestran cada cálculo de precio
- El endpoint de estimación permite probar cambios
- Las respuestas incluyen la fórmula utilizada

---

**✅ Sistema implementado y listo para usar con la fórmula simple solicitada: S/. 3.00 base + S/. 1.00 por kilómetro**
