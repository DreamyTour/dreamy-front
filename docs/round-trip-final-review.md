# Revisión previa del renderizado de ida y vuelta

> Informe histórico anterior a la optimización nativa. El estado y las validaciones actuales se documentan en [round-trip-performance.md](round-trip-performance.md). Los resultados SVG y el bloqueo descritos abajo corresponden a la implementación previa; se conservan como evidencia, junto con la reproducción de fallos preexistentes.

Fecha: 13/11/2026. Rama: `feat/round-trip-rendering-local`.

**Resultado: NO preparar commit.** Se ha confirmado una regresión nueva de rendimiento durante la rotación del mapa. No se modificó la implementación para corregirla en esta revisión. No hay merge, push, despliegue o cambios en producción.

## Referencia verificada

Tras `git fetch origin main`, `origin/main` y `HEAD` siguen en:

`88dceec41364295dbff34f321f89f39869c71e09`

Los cambios de aplicación no están confirmados y el índice permanece vacío. La comparación se hizo en un worktree temporal detached de ese SHA, con las mismas dependencias instaladas mediante una junction `node_modules`. Las pruebas del baseline no contienen los nuevos helpers o componentes de ida/vuelta.

## Problemas ajenos demostrados

### Test de idiomas

Comandos reproducidos en el worktree de `origin/main`:

```powershell
git worktree add --detach <directorio-temporal> origin/main
# Reutilizar node_modules mediante junction, sin cambiar dependencias ni lockfile.
bun test src/lib/languageSelectors.test.ts
bun test src
```

Ambos terminan con exit 1 por:

```text
Cannot find module 'layout/MobileMenu.astro?astro&type=style&index=0&lang.css'
```

Suite completa de main: **213 pass, 1 fail, 1 error**, 214 tests en 35 archivos. Suite completa actual: **221 pass, 1 fail, 1 error**, 222 tests en 36 archivos. El fallo es el mismo; las ocho pruebas unitarias nuevas pasan. Evidencias:

- `artifacts/round-trip-rendering/final-review/main-language-test.log`
- `main-all-unit-tests.log` y `all-unit-tests.log` en esa misma carpeta.

### Biome: distinción entre main y el entorno local

**La configuración duplicada NO está versionada en `origin/main`.** La consulta:

```powershell
git ls-tree -r --name-only origin/main -- .codex-trust-preview biome.json src/lib/languageSelectors.test.ts
```

solo devuelve el `biome.json` raíz y el test. La configuración anidada está en una carpeta local de recuperación:

`.codex-trust-preview/recovery/candidate-UJyUuF/source/biome.json`

Ese archivo local preexiste a la implementación y no se ha modificado. Para demostrar que el bloqueo no depende del código multimodal, se ejecutó primero `bun run lint` en el worktree sin ese archivo y después se copió **únicamente esa configuración** a la misma ruta relativa dentro del worktree, repitiendo `bun run lint`.

- Main sin la configuración duplicada: lint exit 1, **243 errores, 20 advertencias y 7 infos** preexistentes, registrados en `main-lint-clean.log`.
- Main con la misma configuración local: lint exit 1 con **“Found a nested root configuration, but there's already a root configuration”**, idéntico al entorno de trabajo. Evidencia: `main-lint-same-local-config.log`.
- Lint dirigido a los cinco TS/TSX modificados: aprobado, sin aplicar cambios; `changed-files-lint.log`.
- El script `.mjs` de integración se ejecuta completo y pasa `node --check`; queda fuera de los patrones de lint actuales del repositorio.

No se corrigieron ni la configuración ambiental ni los problemas previos de lint/idiomas.

## Regresión nueva que bloquea el commit

Se ejecutó un benchmark local comparativo con **MapTab y MapLibre reales en Chromium headless**, usando WebGL mediante SwiftShader, mismo viewport/estilo local y dos recorridos sintéticos de **1.431 puntos cada uno**, exactamente inversos. Main usa el renderer habitual; la implementación usa el SVG proyectado. Se gira la cámara 2° por paso y varía ligeramente el zoom alrededor de 10,5. Tras 15 muestras de calentamiento se registran 60 intervalos entre frames.

La primera medición coincidió con otras validaciones y **se descartó para la comparación final**. Las dos pasadas finales se ejecutaron secuencialmente, sin otras pruebas activas, alternando implementación y main:

| Pasada aislada | Main: mediana / p95 | Implementación: mediana / p95 |
|---|---|---|
| 1 | **29,6 / 44,1 ms** | **154,0 / 307,4 ms** |
| 2 | **29,8 / 51,4 ms** | **153,1 / 296,5 ms** |

La mediana aumenta aproximadamente **5,2 veces** en ambas pasadas. Esto incumple el requisito de no degradar significativamente el rendimiento. No son métricas de un móvil físico ni Core Web Vitals: son una comparación reproducible del mismo escenario local, suficiente para bloquear la aprobación de esta versión.

Evidencia reproducible en `artifacts/round-trip-rendering/final-review/`:

- `benchmark.mjs`.
- `performance-main-isolated-1.json`, `performance-main-isolated-2.json`.
- `performance-current-isolated-1.json`, `performance-current-isolated-2.json`.
- `baseline-path.txt` y `baseline-sha.txt` identifican el worktree utilizado.

Comando de cada pasada, ejecutado desde el frontend:

```powershell
node artifacts/round-trip-rendering/final-review/benchmark.mjs <ruta-del-worktree-main> performance-main-isolated-1.json
node artifacts/round-trip-rendering/final-review/benchmark.mjs D:/dreamy/dreamy-front performance-current-isolated-1.json
```

Cambiar el nombre del JSON permite repetir la segunda pasada. El benchmark reutiliza las dependencias existentes y un servidor de fixtures local; bloquea cualquier petición externa.

**Inferencia de causa, todavía sin perfil por componente:** `RoundTripRoutes` escucha `render`, vuelve a proyectar todos los puntos, calcula las líneas/flechas y actualiza estado React. El SVG serializa después los paths durante el movimiento de cámara. Ese trabajo nuevo por frame es el principal candidato para investigar. No se presenta esa inferencia como una causa ya demostrada por un profiler.

Una siguiente corrección deberá perfilar y reducir ese trabajo, o reconsiderar el renderer, y volver a comparar contra main antes de preparar el commit. No basta con ocultar la degradación reduciendo la prueba o alterar los GPX.

## Revisión de seguridad y alcance

- Las flechas se anclan sobre el path realmente dibujado y siguen su tangente local; la integración calcula el error respecto a cada segmento y su ángulo. Los colores son naranja/coral según orden del itinerario y las secuencias recorren sentidos contrarios.
- El desplazamiento es solo de pantalla, 4 CSS px por sentido cuando ambos están visibles. Las pruebas verifican separación y ausencia de offset al mostrar individualmente Día 1 y Día 2.
- El test comprueba vista completa, vistas individuales, zoom, giro, bus/barco GPX inversos, variante no emparejada y editor con un par intradía. Para la variante, comprueba que permanecen las ocho capas de línea habituales y que las fuentes conservan exactamente sus coordenadas.
- Los GPX reales de ida y regreso conservan sus SHA-256: `076e0144fe041fc73919fd6f730213607868193c13476c78448a5f98a4d2c59a` y `bf3aa2421fb6eb8276da354f561c58ec8f11233f8ab8a75cfc9283fb4d65413c`.
- `git diff origin/main` no muestra cambios en modelos/seguridad de routePlan, contrato, API, dependencias o lockfile. Las modificaciones del editor se limitan a preparar datos derivados y montar la capa visual; importador, confirmaciones, commit/publish y restauración no cambian.
- La integración verifica que los datos originales del fixture no cambian y que no se emiten mensajes de escritura por acciones de presentación.
- Las pruebas GPX y de persistencia siguen pasando. No se detectó una regresión de datos; el bloqueo encontrado es de rendimiento.
- Los casos sin pareja siguen usando `TransportRoute`; las selecciones individuales ocultan únicamente otros días como exige el nuevo comportamiento. El renderer estático `RouteMapPreview` permanece sin cambios.

## Validaciones finales ejecutadas

| Validación | Resultado |
|---|---|
| Unitarias enfocadas, seis suites | **38 aprobadas**, 141 aserciones |
| Suite unitaria completa | 221 aprobadas y el fallo de idiomas reproducido en main |
| Integración MapLibre/WebGL | Aprobada; incluye GPX reales, vistas por día/completa, variantes y editor |
| Regresión buscador | **9 casos aprobados** |
| Integración editor/GPX | **17 escenarios aprobados** |
| Persistencia Strapi/SQLite desechable | **16 comprobaciones aprobadas** |
| Astro check | **0 errores, 0 advertencias**; hints informativos |
| Build completo aislado | Aprobado con fixtures CMS en localhost, sin catálogo remoto |
| Lint de archivos modificados TS/TSX | Aprobado |
| `node --check` del test de integración | Aprobado |
| `git diff --check` | Aprobado |
| Comparación de rendimiento | **Falla: regresión significativa confirmada** |

Los logs de esta ejecución están en `artifacts/round-trip-rendering/final-review/`. El build ejecuta compilación y prerender completos con catálogo ficticio y no acredita las páginas de todos los tours reales. No se accedió al CMS de producción; el test de persistencia utiliza una instancia temporal.

## Limitaciones pendientes

- Teselas satelitales reales, dispositivos móviles físicos y lector de pantalla manual: pendientes. La prueba de móvil usa 390 CSS px y el modo oscuro local, no fotografía satelital externa.
- Coincidencias parciales o distinto muestreo quedan deliberadamente sin emparejar.
- No se valida que todo mapa existente sea idéntico visualmente; se verifican las ramas emparejada/no emparejada y la preservación de fuentes en fixtures.
- El benchmark no demuestra el coste exacto de cada función ni reemplaza mediciones de GPU física. La regresión comparativa se reproduce y no puede darse por aceptable.

## Estado de entrega

Rama `feat/round-trip-rendering-local`, `HEAD` sin cambios en `88dceec`. **No se ha creado commit.** Solo se ampliaron las aserciones de integración y la documentación de revisión; los archivos temporales, capturas y GPX no se prepararon para Git. La implementación queda local para corregir el rendimiento antes de una nueva revisión. Sin push, merge, despliegue, modificación del CMS ni infraestructura.
