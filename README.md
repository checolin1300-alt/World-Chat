# WorldChat - Chat Global en Tiempo Real 🌍💬

WorldChat es una aplicación web de chat global en tiempo real donde cualquier persona puede dejar mensajes públicos visibles para todos los usuarios. Está construida usando tecnologías modernas enfocadas en el rendimiento, la escalabilidad y una experiencia de usuario increíble.

## Características

- **Sistema de Usuarios**:
  - Registro e inicio de sesión seguro.
  - Gestión de perfil: Elección de un nombre de usuario único (@username) y subida de foto de perfil.
  - Contraseñas almacenadas de forma segura y encriptada (vía Supabase Auth).
- **Chat**:
  - Un muro de chat global en donde todos los usuarios conversan.
  - Mensajes con información enriquecida: Avatar del usuario, nombre de usuario y marca de tiempo.
  - Actualización en **tiempo real** de los mensajes entrantes (sin tener que recargar la página).
  - Los mensajes se muestran en orden, mostrando primero los más recientes en la parte inferior, y se hace auto-scroll automático.
- **Experiencia y Diseño UI**:
  - Interfaz moderna y limpia, con transiciones fluidas.
  - **Modo Oscuro / Modo Claro** con integración al sistema operativo o almacenamiento local.
  - Diseño 100% responsivo (funciona a la perfección en móviles y computadoras de escritorio).

## Tecnologías Utilizadas

- **Frontend**: React + TypeScript (inicializado con Vite)
- **Estilos**: Tailwind CSS
- **Íconos**: Lucide React
- **Backend & Base de datos**: Supabase (Autenticación, Base de datos PostgreSQL, Supabase Realtime y Storage para imágenes)
- **Despliegue**: Preparado para Vercel

---

## 🚀 Cómo ejecutar el proyecto localmente

1. **Clona este repositorio o descarga los archivos.**
2. **Instala las dependencias** abriendo una terminal en la carpeta raíz del proyecto y ejecutando:
   ```bash
   npm install
   ```
3. **Configura las variables de entorno**:
   - Copia el archivo `.env.example` y renómbralo a `.env`. (El archivo `.env` ya cuenta con reglas en `.gitignore` para no subirlo a GitHub).
   - Este archivo debe contener al menos estas dos variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - _(Ver sección inferior sobre la configuración de Supabase para obtener estos valores)._

4. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
5. Abre la aplicación en tu navegador accediendo a la URL indicada (generalmente `http://localhost:5173`).

---

## 🛠 Configuración de Supabase

Este proyecto requiere que crees un proyecto en **Supabase** para funcionar y gestionar los datos.

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) y crea un nuevo proyecto.
2. Dentro de tu proyecto en Supabase, ve a la sección **Project Settings > API** y busca la `Project URL` y la `anon public API key`.
3. Pega estos valores en tu archivo `.env` local como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Base de Datos, Políticas y Storage**:
   - En tu proyecto de Supabase ve a la pestaña **SQL Editor**.
   - Haz clic en `New query` y **copia y pega** al editor todo el contenido del archivo `database.sql` incluido en este repositorio.
   - Ejecuta (_Run_) el comando. Este archivo `database.sql` se encargará de:
     - Crear la tabla `profiles` y la tabla `messages`.
     - Establecer que la tabla `messages` se exponga a través de [Supabase Realtime](https://supabase.com/docs/guides/realtime).
     - Configurar **Row Level Security** (RLS) para proteger los datos de forma que solo usuarios autenticados puedan escribir.
     - Crear el bucket público (carpeta) `avatars` en **Storage**, donde se guardarán las fotos de perfil.

---

## 🌐 Cómo desplegar en Vercel

El proyecto ya está configurado para un despliegue sin fricciones. Se incluye un archivo `vercel.json` esencial para el enrutamiento de [Single Page Applications (SPA)](https://vitejs.dev/guide/build.html).

1. Crea o ingresa a tu cuenta en [Vercel](https://vercel.com/).
2. Conecta tu repositorio de GitHub.
3. Importa este proyecto en Vercel. Vercel detectará automáticamente que es un proyecto de **Vite/React**.
4. **Importante**: En la sección de configuración de `Environment Variables` en Vercel, agrega:
   - `VITE_SUPABASE_URL` (con tu URL de Supabase)
   - `VITE_SUPABASE_ANON_KEY` (con tu llave anónima de Supabase)
5. Haz clic en **Deploy**. ¡Tu aplicación ahora está disponible en internet!
