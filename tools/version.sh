#!/bin/sh
# Marca una nueva versión publicada: actualiza ?v= de css/js en index.html,
# la constante ESM_VERSION y version.txt con el mismo sello.
# Uso (desde la raíz del proyecto): sh tools/version.sh
V=$(date +%Y%m%d%H%M%S)
sed -i -E "s#(href=\"css/app\.css|src=\"js/[a-z0-9]+\.js)\?v=[^\"]*\"#\1?v=$V\"#g; s#var ESM_VERSION = '[^']*'#var ESM_VERSION = '$V'#" index.html
printf '%s\n' "$V" > version.txt
echo "$V"
