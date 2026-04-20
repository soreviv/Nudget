# Security Policy

## Versiones soportadas

| Versión | Soporte de seguridad |
|---------|---------------------|
| `main`  | ✅ Activa            |

## Reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto, **no abras un Issue público**. En su lugar:

1. Envía un correo a **drviverosorl@gmail.com** con el asunto `[SECURITY] Nudget — <título breve>`.
2. Incluye:
   - Descripción del problema y posible impacto
   - Pasos reproducibles o prueba de concepto
   - Versión/commit afectado
3. Recibirás respuesta en un plazo de **72 horas**.
4. Una vez confirmada y corregida la vulnerabilidad, se te acreditará en el changelog (salvo que prefieras anonimato).

## Advertencias de seguridad conocidas

### Backend PocketBase expuesto sin autenticación

Por defecto, PocketBase permite acceso público a las colecciones si las reglas no están configuradas. Esto es seguro en uso local, pero riesgoso si se expone en un servidor público:

| Riesgo | Mitigación recomendada |
|--------|------------------------|
| Acceso no autorizado a los datos | Configurar reglas de acceso en cada colección desde el panel `/_/` |
| Lectura/escritura masiva desde internet | Habilitar autenticación de usuario en PocketBase y restringir las colecciones |
| Exposición de datos personales financieros | No exponer el puerto 8090 en un servidor público sin autenticación |

## Buenas prácticas para despliegue en producción

- [ ] Configurar reglas de acceso (`View`, `Create`, `Update`, `Delete`) en todas las colecciones
- [ ] Habilitar autenticación de usuario en PocketBase
- [ ] Servir tanto PocketBase como `index.html` únicamente sobre **HTTPS**
- [ ] Cambiar la contraseña de administrador por defecto (`/_/`)
- [ ] No almacenar información sensible adicional (contraseñas, datos bancarios completos) en los campos de texto libre
- [ ] Hacer backups regulares del archivo `pb_data/data.db`

## Alcance

Este proyecto es una aplicación de finanzas personales de un solo archivo. El alcance de seguridad cubre:

- Manipulación de datos a través de la API de Supabase
- Inyección de contenido en el DOM (XSS)
- Exposición de credenciales en el repositorio

Quedan fuera del alcance los ataques a la infraestructura de Supabase o Google Fonts, que son responsabilidad de sus proveedores.
