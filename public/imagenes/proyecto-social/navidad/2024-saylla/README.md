# Campaña navideña 2024 — Saylla, Cusco

Guardar aquí las versiones web. Mantener los originales fuera de `public/` para no desplegarlos.

Por cada fotografía, exportar estos tres archivos (minúsculas y sin espacios):

| Archivo | Dimensiones recomendadas | Peso objetivo | Tope orientativo |
| --- | --- | --- | --- |
| `foto-01.webp` | 1600 × 1067 px | 150–250 KB | 350 KB |
| `foto-01-800.webp` | 800 × 533 px | 50–90 KB | 120 KB |
| `foto-01-thumb.webp` | 240 × 160 px | 5–12 KB | 20 KB |

Continuar con `foto-02`, `foto-03`, etc. La primera será la portada de la campaña. Elegir de 4 a 8 fotos diferentes para contar la actividad; no es necesario llenar todas las posiciones.

Formato WebP, perfil sRGB y sin metadatos GPS. Calidad de exportación inicial 75–82, ajustándola según el detalle de cada foto. Estos pesos son presupuestos de este proyecto, no una regla universal. Comprobar rostros y detalles al 100%; no sacrificar legibilidad solo para alcanzar un peso.

Preferir encuadres horizontales 3:2. No deformar las fotos; si son verticales, conservar la proporción y exportar a un máximo de 1600 px en el lado largo. Mantener el mismo encuadre en las tres versiones. No ampliar originales pequeños. Conservar espacio alrededor de las personas para el recorte de la vista previa.

La galería carga la versión de 800 px; las miniaturas usan la de 240 px y el lightbox la de 1600 px. No hace falta preparar otra imagen para el hero por ahora.

Cuando estén listas, añadir los nombres base a `photos` de la campaña 2024 en `src/components/content/ChristmasProjectContent.astro`: `["foto-01", "foto-02", "foto-03"]`. Revisar también los textos alternativos según lo que muestre cada fotografía.
