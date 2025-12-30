#!/usr/bin/env bash
set -euo pipefail

# Backup local MongoDB into a directory and restore to Atlas (no gzip/archive)
# Usage: ./backup_and_restore_mongo.sh [atlas_password]

LOCAL_MONGO_URI=${LOCAL_MONGO_URI:-mongodb://localhost:27017/sistema_gestion}
ATLAS_USER=${ATLAS_USER:-gonzalo}
ATLAS_HOST=${ATLAS_HOST:-cluster0.sdkklxl.mongodb.net}
ATLAS_DB=${ATLAS_DB:-sistema_gestion}

if [ "$#" -ge 1 ] && [ -n "$1" ]; then
  ATLAS_PASSWORD="$1"
fi

if [ -z "${ATLAS_PASSWORD:-}" ]; then
  if [ -n "${MONGO_ATLAS_PASSWORD:-}" ]; then
    ATLAS_PASSWORD="$MONGO_ATLAS_PASSWORD"
  else
    echo -n "Atlas password: "
    read -r -s ATLAS_PASSWORD
    echo
  fi
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_DIR="mongo_dump_${TIMESTAMP}"
TMP_DIR="./mongo_backups"
DEST_DIR="${TMP_DIR}/${DUMP_DIR}"
mkdir -p "$TMP_DIR"

echo "Creating dump from local MongoDB ($LOCAL_MONGO_URI) into directory $DEST_DIR ..."
mongodump --uri="$LOCAL_MONGO_URI" --out="$DEST_DIR"

if [ $? -ne 0 ]; then
  echo "mongodump failed" >&2
  exit 1
fi

ATLAS_URI="mongodb+srv://${ATLAS_USER}:${ATLAS_PASSWORD}@${ATLAS_HOST}/${ATLAS_DB}"


# If dump directory contains a nested directory with the same DB name,
# use the parent directory for mongorestore to avoid the "don't know what to do with subdirectory" error.
if [ -d "${DEST_DIR}/${ATLAS_DB}" ]; then
  RESTORE_DIR="$(dirname "$DEST_DIR")"
  echo "Detected nested DB directory. Using parent directory for restore: $RESTORE_DIR"
else
  RESTORE_DIR="$DEST_DIR"
fi

echo "Restoring to Atlas (user: ${ATLAS_USER}, host: ${ATLAS_HOST}) from directory $RESTORE_DIR ..."
mongorestore --uri="$ATLAS_URI" --dir="$RESTORE_DIR" --drop

if [ $? -ne 0 ]; then
  echo "mongorestore failed" >&2
  exit 2
fi

echo "Backup directory saved to ${DEST_DIR} and restored to Atlas successfully."
echo "If you want to keep the dump elsewhere, move the directory from ${TMP_DIR}."

exit 0
