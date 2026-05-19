#!/bin/bash
# /scripts/start.sh
HERE=$(cd $(dirname "$0") && pwd); 
if [[ "${HERE:2:1}" == "/" ]]; then DRIVE="${HERE:0:2}";
elif [[ "${HERE:4:1}" == "/" && "${HERE:6:1}" == "/" ]]; then DRIVE="${HERE:0:6}";
else DRIVE=""; fi # "", "/c", "/mnt/c"
ENV="dist"; # "dist", "packages"
TARGET="./$ENV/sys/index.js";
INPUT='[]'; # '', '["v 0",{"v1p0":"v1v 0"}]'
if command -v wslpath >/dev/null 2>&1; then TARGET="$(wslpath -w "$TARGET")"; fi
COMMAND="node";
if ! command -v "$COMMAND" >/dev/null 2>&1; then COMMAND="$DRIVE/Program Files/nodejs/$COMMAND.exe"; fi
# echo " !!!!! $HERE !!!!! $COMMAND !!!!! $TARGET "; read;
"$COMMAND" --inspect --preserve-symlinks --preserve-symlinks-main "$TARGET" "$INPUT"
