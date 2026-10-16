# Proyecto Social — propuesta de página y sección del home

Fecha: 14 de octubre de 2026. Estado: primera versión implementada en español.

Implementado: sección «Turismo con propósito» en el home con los tres compromisos; página `/es/proyecto-social/` con composición editorial; fotografías de las dos campañas guardadas localmente; acceso desde el pie. Cada compromiso enlaza desde su imagen, título y botón «Leer más», sin numeración. Por indicación del usuario, Turismo sostenible y Turismo cultural usan `#` hasta contar con sus destinos; Proyecto social abre `/es/proyecto-social/`. Las iniciativas sociales conservan los enlaces de detalle del sitio actual.

## Objetivo y fuente

Crear una página de Proyecto Social de Dreamy Tours y una sección del home que reúna tres compromisos: turismo sostenible, turismo cultural y proyecto social. Fuente del proyecto social revisada: http://localhost/dtour/es/proyecto-social/ (respuesta HTTP 200). El contenido específico de turismo sostenible y turismo cultural se revisará antes de crear sus páginas.

La captura aportada define la composición visual: grandes fotografías, texto breve, bloques alternados, una superficie de color que se prolonga detrás de las imágenes y amplios espacios. El contenido será el de Dreamy Tours. Las cifras de beneficiarios y empleos, el porcentaje de trabajadores locales, el video y las alianzas con ONG que aparecen en la referencia no están respaldados por la fuente de Dreamy Tours y no se incorporarán como datos propios.

## Dirección visual

Convención del tema: colocar `SectionDivider.astro` inmediatamente debajo de los títulos de sección (H2), usando el color `secondary`. Alinear el divisor con el encabezado; usar `align="center"` en encabezados centrados. Reutilizar este componente en las nuevas secciones, sin crear variantes decorativas adicionales.

Estilo editorial cálido, centrado en las personas y las acciones reales. Mantener Outfit y los colores del sitio; usar el verde de marca como acento principal y un fondo cálido suave en el bloque de compromiso. Conservar la asimetría y los solapamientos de la referencia en escritorio. En móvil, colocar imagen y texto en una columna, sin solapamientos que dificulten la lectura.

## Sección del home

Ubicación propuesta: después de TravelExperiences y antes de ReviewsWall. Este bloque presenta la forma de entender el turismo de Dreamy Tours: cuidar el entorno, valorar la cultura y contribuir a las comunidades.

- Antetítulo: «Nuestros compromisos».
- Título: «Turismo con propósito».
- Introducción propuesta: «Una forma de viajar que cuida el entorno, valora la cultura y conecta con las comunidades».

Presentar los tres campos como **pilares de nuestro compromiso**. Turismo sostenible y turismo cultural son enfoques de trabajo; el proyecto social reúne iniciativas concretas. Las campañas navideñas, la entrega de útiles y la reforestación pertenecen al contenido de la página social y no sustituyen los tres campos del home.

| Bloque | Descripción propuesta | Acción |
| --- | --- | --- |
| Turismo sostenible | Viajar con respeto por la naturaleza y el entorno de los destinos que visitamos. | «Conoce nuestro enfoque», hacia su página cuando exista. |
| Turismo cultural | Acercarnos a la historia, las tradiciones y la identidad de las comunidades locales. | «Descubre nuestra conexión», hacia su página cuando exista. |
| Proyecto social | Compartir oportunidades y apoyar a las comunidades de Cusco y el Valle Sagrado mediante nuestras iniciativas. | «Conoce nuestras iniciativas», hacia `/es/proyecto-social/`. |

Los textos de turismo sostenible y cultural son propuestas editoriales pendientes de contrastar con su contenido real; no implican certificaciones ni resultados medidos.

Diseño actualizado: sección compacta integrada al tema, con sus fuentes globales y variables de color. Fondo del sitio, sin patrones decorativos ni pie propio. En escritorio amplio, una introducción lateral acompaña los tres compromisos con fotografías horizontales y descripciones breves; en móvil, cada foto pequeña se coloca al lado de su texto para reducir la altura. Activar cada enlace cuando su destino esté disponible.

## Estructura de la página

Ruta propuesta: `/es/proyecto-social/`.

1. **Hero del tema.** Reutilizar el hero compartido de las páginas: fotografía de campaña de fondo, título «Proyecto Social», antetítulo «Turismo con propósito» y descripción breve centrada. Mantener tamaños, tipografía, superposición y decoración del resto del sitio. El cuerpo editorial comienza debajo del hero, sin una segunda portada.
2. **Nuestro objetivo.** Composición de dos columnas: texto sobre devolver a las comunidades y generar un impacto positivo y duradero; fotografía real al lado. Usar fotografía estática mientras no exista un video propio verificado.
3. **Compromiso con nuestras comunidades.** Imagen lateral y bloque de fondo cálido. Adaptar el compromiso actual de operar de forma responsable y ética y la ubicación de las acciones en Cusco y el Valle Sagrado.
4. **¿Cómo apoyamos?** Tres pilares sin numeración: entrega de útiles escolares, campañas navideñas y reforestación con especies nativas. Un panel compartido reúne iconos destacados y etiquetas «Aprender», «Compartir» y «Cuidar», con acentos de los colores primary y secondary del tema. En móvil se apilan con separadores finos. Texto tomado de la fuente y editado para mejorar legibilidad, sin ampliar las promesas.
5. **Nuestras iniciativas.** Dos módulos amplios, con imagen, descripción y enlace: Proyecto Navideño y Entrega de Útiles Escolares. La fuente presenta reforestación como un pilar, pero no enlaza una página propia para ese proyecto.
6. **Cierre.** Mensaje de compromiso y botón «Conversemos sobre el proyecto», usando el contacto ya configurado en el sitio. No ofrecer mecanismos de donación sin un proceso definido.

## Contenido y recursos identificados

La fuente describe entrega anual de kits escolares, mochilas y materiales educativos a niños de comunidades rurales; campañas navideñas con juguetes, alimentos y celebraciones; y jornadas de reforestación con especies nativas. El proyecto navideño declara actividad desde 2020. No hay métricas numéricas de impacto en esta página.

| Iniciativa | Imagen identificada | Enlace actual |
| --- | --- | --- |
| Proyecto Navideño | `http://localhost/dtour/wp-content/uploads/proyecto-navideno-dreamy-tours.webp` | `https://dreamy.tours/es/proyecto-social/proyecto-navideno/` |
| Entrega de Útiles Escolares | `http://localhost/dtour/wp-content/uploads/utiles-5.webp` | `https://dreamy.tours/es/proyecto-social/entrega-de-utiles-escolares/` |

Descargar y revisar las imágenes durante la implementación; las rutas de localhost son recursos de origen, no URLs que deben quedar en producción. Revisar las páginas de detalle antes de decidir si conservar los enlaces actuales o migrarlas en una fase adicional.

## Integración en el proyecto

La aplicación usa Astro y páginas de contenido registradas mediante `src/lib/dynamicPageRoutes.ts`. La implementación debe integrarse con ese sistema y con el layout global, reutilizando encabezado, pie y metadatos.

- Crear `src/content/pages/es/proyecto-social.astro` con frontmatter y SEO propios.
- Crear `src/components/content/SocialProjectContent.astro` para el cuerpo editorial.
- Crear `src/components/sections/PurposeTourism.astro` para los tres compromisos del home.
- Integrar el bloque en `src/components/pages/HomePage.astro`.
- Revisar el contenedor de `DynamicContentPage.astro` antes de introducir la apertura: debe existir un solo H1 y evitar duplicar el hero global con el de la referencia.
- Preparar textos y rutas para el sistema de idiomas existente. La primera versión usa el contenido español verificado; los homes en inglés y portugués solo incorporarán el bloque cuando sus textos y rutas equivalentes estén preparados.
- Incorporar acceso desde el pie o «Sobre nosotros» según la configuración actual de navegación.

## Orden de implementación y validación

### Proyecto navideño implementado

Ruta: `/es/proyecto-social/proyecto-navideno/`. Fuente consultada: `http://localhost/dtour/es/proyecto-social/proyecto-navideno/`.

Hero compartido del tema y timeline alternado con línea vertical entrecortada, años en rojo y ubicaciones en verde. Se presentan las campañas documentadas en el texto de origen: Patacolca/Cusipata (2023), Saylla (2022), Huilloq (2021) y Saylla (2020). Los archivos con «2024» forman parte de la galería que la fuente coloca bajo 2023; se conservan los años del texto sin deducir fechas de los nombres de archivo.

Cada campaña tiene tres fotografías locales, miniaturas, controles anterior/siguiente y lightbox nativo con navegación por teclado y cierre con Escape. El componente reutilizable `ProjectGallery.astro` conserva enlaces directos a las imágenes si JavaScript no está disponible. El diseño usa Tailwind y el divisor común. El enlace de la página social abre ahora la nueva ruta local.

### Entrega de útiles escolares implementada

Ruta: `/es/proyecto-social/entrega-de-utiles-escolares/`. Plantilla simple para una actividad, siguiendo la aclaración del usuario: hero común, descripción breve, galería de seis fotos y retorno a Proyecto Social. No se publican fechas, cifras ni ubicación concreta que no estén confirmadas. El contenido editable se concentra en `activity` dentro de `SchoolSuppliesContent.astro`. Las fotos se guardan localmente desde la página de origen. Reutiliza `ProjectGallery.astro`, con miniaturas desplazables en pantallas pequeñas y lightbox sin textos visibles. Todo el diseño usa Tailwind.

1. Revisar y guardar las fotografías reales; inspeccionar las páginas de las dos iniciativas.
2. Construir la página en español y verificar la ruta mediante el registro existente.
3. Revisar contenido y destinos de turismo sostenible y turismo cultural; construir e integrar la sección del home con sus tres compromisos.
4. Revisar escritorio y móvil, jerarquía de títulos, contraste, foco de teclado, enlaces e imágenes.
5. Ejecutar los controles de Astro y la compilación; verificar que no se introduzcan enlaces a localhost.

Reservar dimensiones de las imágenes para evitar saltos de layout. Priorizar la imagen principal; diferir las imágenes inferiores. Los textos alternativos deben describir lo visible. El resultado debe conservar el lenguaje visual del sitio y la composición de la referencia, con contenido verificable de Dreamy Tours.
