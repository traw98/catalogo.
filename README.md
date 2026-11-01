# Catálogo AUREV JEWELRY

Página de catálogo: muestra las joyas con foto y precio en pesos colombianos. Al tocar **Pedir**, se abre WhatsApp (+57 304 606 6497) con el nombre, el código y el precio de la pieza ya escritos.

No usa Claude ni ningún servicio pago. Todo se cambia desde github.com.

## Qué hay en la carpeta

| Archivo | Para qué sirve | ¿Se toca? |
|---|---|---|
| `productos.csv` | Lista de productos: nombre, precio, fotos, estado | **Sí, siempre** |
| `fotos/` | Carpeta con las fotos de los productos | **Sí, siempre** |
| `ajustes.js` | WhatsApp, Instagram, mensajes y texto del pie de página | A veces |
| `logo.png` | Logo de la marca (súbelo con ese nombre exacto) | Una vez |
| `index.html`, `estilos.css`, `app.js` | El diseño y el funcionamiento | **No** |

---

## 1. Subir el catálogo a GitHub (una sola vez)

1. Crea una cuenta en github.com.
2. Arriba a la derecha toca **+** y luego **New repository**.
3. Nombre: `catalogo`. Marca **Public**. Toca **Create repository**.
4. Toca **uploading an existing file**.
5. Descomprime el ZIP y arrastra **todo lo que hay dentro**, incluida la carpeta `fotos`.
6. Toca **Commit changes**.

## 2. Publicar la página (una sola vez)

**Opción A, recomendada: Cloudflare Pages (gratis)**

1. Crea una cuenta en cloudflare.com.
2. Entra a **Workers & Pages** y crea un proyecto de **Pages** conectado a Git (*Connect to Git*).
3. Autoriza GitHub y elige el repositorio `catalogo`.
4. Framework preset: **None**. Build command: **vacío**. Output directory: **/** o vacío.
5. Toca **Save and Deploy**. La página queda en una dirección tipo `catalogo-xxx.pages.dev`.

A partir de ahí, cada cambio que hagas en GitHub se publica solo.

**Opción B: GitHub Pages**

En el repositorio: **Settings**, luego **Pages**, luego Source: **Deploy from a branch**, rama **main**, carpeta **/(root)**, y **Save**. La dirección queda `https://TU-USUARIO.github.io/catalogo/`.

Ojo: las reglas de GitHub Pages dicen que no se debe usar para tiendas o negocios en línea. Por eso es mejor la opción A.

Los cambios pueden tardar unos minutos en verse. Si no aparecen, recarga la página.

---

## 3. Agregar o cambiar productos

1. En GitHub abre `productos.csv` y toca el **lápiz** (Edit).
2. Cada línea es un producto. La primera línea son los títulos: **no la borres**.

```
codigo,nombre,categoria,precio,descripcion,fotos,estado
AUR-007,Cadena franco 4 mm,Cadenas,90000,Oro laminado. Largo 60 cm.,franco-1.jpg|franco-2.jpg,nuevo
```

3. Toca **Commit changes**.

| Columna | Cómo llenarla |
|---|---|
| codigo | Corto y sin espacios: AUR-007. No repetir |
| nombre | Nombre de la pieza |
| categoria | Cadenas, Pulseras, Anillos, Aretes, Dijes… Los botones de filtro se crean solos |
| precio | Solo números: `90000`. Si se deja vacío, sale "Consultar precio" |
| descripcion | Corta. **Sin comas**. Usa punto. Si necesitas comas, pon todo el texto entre comillas: `"Largo 60 cm, cierre de caja"` |
| fotos | Nombre exacto del archivo. Varias fotos: sepáralas con `\|`. La primera es la portada |
| estado | `disponible`, `nuevo` (sello dorado), `agotado` (botón "Avísame") u `oculto` (no se muestra) |

**Desde Excel:** abre `productos.csv`, edita y guarda con **Guardar como → CSV UTF-8**. Después súbelo a GitHub para reemplazar el anterior.

## 4. Subir fotos

1. En GitHub abre la carpeta `fotos`.
2. Toca **Add file**, luego **Upload files**, arrastra las fotos y toca **Commit changes**.
3. Escribe ese mismo nombre en la columna `fotos` de `productos.csv`.

Recomendaciones:
- Nombres sin espacios, sin tildes y en minúscula: `cadena-cubana-1.jpg`.
- Fotos cuadradas, fondo oscuro o liso, buena luz.
- Que pesen menos de 1 MB para que la página cargue rápido.

**Para cambiar una foto:** sube la nueva con **el mismo nombre** y reemplaza la anterior.

Cuando ya estén los productos reales, borra las filas `(ejemplo)` de `productos.csv` y las fotos `ejemplo-*.svg`.

## 5. Logo e Instagram

- **Logo:** sube el logo a la carpeta principal con el nombre `logo.png`. Aparece solo arriba.
- **Instagram:** en `ajustes.js`, escribe el usuario entre las comillas de `instagram: ""`, sin @.

## Problemas comunes

| Qué pasa | Por qué | Solución |
|---|---|---|
| Sale "Foto pendiente" | El nombre de la foto no coincide | Revisa que el nombre en el CSV sea igual al del archivo |
| Un producto sale con datos corridos | Hay una coma en la descripción | Quita la coma o pon el texto entre comillas |
| Las tildes salen raras (Ã±) | Excel guardó en otro formato | Guarda como **CSV UTF-8** |
| No sale ningún producto | Se borró la primera línea de títulos | Vuelve a poner: `codigo,nombre,categoria,precio,descripcion,fotos,estado` |
| El cambio no aparece | Todavía se está publicando | Espera unos minutos y recarga |
