#!/usr/bin/env bash
set -euo pipefail

TAG="v0.1.2"
MSG="Release ${TAG} - trial & upload improvements"

echo "Creating tag ${TAG}..."
git tag -a "${TAG}" -m "${MSG}"
git push origin "${TAG}"

echo "Done. Don't forget to create a GH release from the tag if needed."
