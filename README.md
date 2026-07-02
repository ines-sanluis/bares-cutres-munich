# Bares cutres de Múnich

Mapa interactivo con [100 bares cutres de Múnich](https://www.google.com/maps/d/viewer?mid=1v2JwzCR7tzoIXnyutpcvhmofkMxc884), basado en el [Google My Maps original](https://www.google.com/maps/d/u/1/edit?mid=1v2JwzCR7tzoIXnyutpcvhmofkMxc884&usp=sharing).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

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
