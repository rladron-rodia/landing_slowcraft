#!/usr/bin/env bash
# download-fonts.sh
# True self-hosting: descarga las .woff2 desde jsdelivr y las guarda en /fonts/.
# Después podés cambiar las URLs absolutas en index.html por relativas (fonts/...woff2)
# y eliminar la dependencia del CDN externo.
#
# Uso:
#   bash scripts/download-fonts.sh
#
# Pre-requisito: curl. macOS y Linux lo tienen instalado por defecto.

set -euo pipefail

cd "$(dirname "$0")/.."  # ir a la raíz del repo
mkdir -p fonts

CDN="https://cdn.jsdelivr.net/npm/@fontsource"

declare -a FONTS=(
  "newsreader@5/files/newsreader-latin-400-normal.woff2"
  "newsreader@5/files/newsreader-latin-400-italic.woff2"
  "newsreader@5/files/newsreader-latin-500-normal.woff2"
  "inter@5/files/inter-latin-400-normal.woff2"
  "inter@5/files/inter-latin-500-normal.woff2"
  "inter@5/files/inter-latin-600-normal.woff2"
  "jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2"
  "jetbrains-mono@5/files/jetbrains-mono-latin-500-normal.woff2"
)

echo "Descargando fonts a fonts/…"
for path in "${FONTS[@]}"; do
  filename=$(basename "$path")
  echo "  → $filename"
  curl -sSL --fail --max-time 30 \
    -o "fonts/$filename" \
    "$CDN/$path"
done

echo ""
echo "✓ Listo. ${#FONTS[@]} fuentes descargadas a fonts/"
echo ""
echo "Próximo paso: en index.html, reemplazá las URLs absolutas:"
echo "  https://cdn.jsdelivr.net/npm/@fontsource/{...}.woff2"
echo "por relativas:"
echo "  fonts/{nombre-archivo}.woff2"
echo ""
echo "Y eliminá los <link rel='preload'> y <link rel='preconnect'> apuntando a jsdelivr."
echo "Después: git add fonts/ && git commit -m 'chore: self-host fonts' && git push"
