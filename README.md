# Bares cutres de Múnich

Mapa interactivo con [100 bares cutres de Múnich](https://www.google.com/maps/d/viewer?mid=1v2JwzCR7tzoIXnyutpcvhmofkMxc884), basado en el [Google My Maps original](https://www.google.com/maps/d/u/1/edit?mid=1v2JwzCR7tzoIXnyutpcvhmofkMxc884&usp=sharing).

Además del mapa, la app funciona como diario de visitas compartido: marcar un bar como
visitado (se pone verde), guardar el precio de la cerveza, la fecha, una nota, una foto y
dos votos de 1 a 5 🍺 (Ines y Fabienne).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Configurar Supabase

Las visitas se guardan en Supabase para que se vean desde cualquier móvil.

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el dashboard, abre **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Esto crea la tabla
   `visits` y el bucket público `bar-photos`.
3. Copia `.env.example` a `.env.local` y rellena los valores desde
   **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

   - `SUPABASE_URL` — la URL del proyecto.
   - `SUPABASE_SERVICE_ROLE_KEY` — la clave `service_role`.
   - `APP_PASSWORD` — la contraseña compartida para editar (elige la que quieras).

La clave `service_role` solo se usa en el servidor (Server Components y Server Actions),
nunca llega al navegador. Sin estas variables la app sigue funcionando, pero en modo solo
lectura y sin visitas.

Al desplegar en Vercel, añade las tres variables en **Settings → Environment Variables**.

## Contraseña

El mapa es de lectura pública, pero para crear, editar o borrar visitas hay que entrar con
la contraseña de `APP_PASSWORD` (abajo a la izquierda en la barra lateral). La sesión se
guarda en una cookie `httpOnly` durante 90 días, así que solo se escribe una vez por
dispositivo.

La comprobación se hace **en el servidor en cada escritura**, no solo escondiendo botones:
sin la cookie correcta, `saveVisit` y `deleteVisit` rechazan la petición aunque alguien la
lance a mano.

> Si `APP_PASSWORD` está vacía, nadie puede editar (falla en cerrado). Acuérdate de
> añadirla también en Vercel.

## Desplegar en Vercel

1. Sube el repo a GitHub (o conéctalo directamente desde la carpeta del proyecto).
2. Ve a [vercel.com/new](https://vercel.com/new) e importa el repositorio.
3. Vercel detecta Next.js automáticamente — no hace falta configuración extra.
4. Pulsa **Deploy**.

También puedes desplegar desde la CLI:

```bash
npx vercel
```

## Actualizar los bares

Los datos están en `src/data/bars.json`, exportados del KML de Google My Maps:

```bash
curl -sL "https://www.google.com/maps/d/kml?mid=1v2JwzCR7tzoIXnyutpcvhmofkMxc884" -o /tmp/bares.kmz
unzip -p /tmp/bares.kmz doc.kml > /tmp/bares.kml
# Luego vuelve a generar bars.json con el script de parseo
```

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/) tiles
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres + Storage) para las visitas
