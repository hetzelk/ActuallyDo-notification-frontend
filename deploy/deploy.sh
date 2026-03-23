#!/usr/bin/env bash
# Build and deploy a frontend app to S3 + CloudFront.
#
# Usage: ./deploy/deploy.sh <app-name>
#
# Steps: validate → load config → check infra → build → upload → invalidate → wait → report
#
# Exit codes:
#   0 = success
#   1 = invalid app name
#   2 = missing config file
#   3 = infrastructure not provisioned
#   4 = build failed
#   5 = empty build output
#   6 = S3 upload failed
#   7 = CloudFront invalidation failed
#
# To add a new app:
#   1. Create deploy/<app-name>.env with VITE_APP_DOMAIN and other VITE_* vars
#   2. Create src/apps/<app-name>/index.html and main.tsx
#   3. Run: ./deploy/setup.sh <app-name>
#   4. Run: ./deploy/deploy.sh <app-name>
set -euo pipefail

SCRIPT_NAME="deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
START_TIME=$(date +%s)

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/config.sh
source "${SCRIPT_DIR}/lib/config.sh"

# --- Validation ---

APP_NAME="${1:-}"

validate_app_name "$APP_NAME" || exit 1
require_command "aws" || exit 1
require_command "npx" || exit 1

load_config "$APP_NAME" || exit 2

DOMAIN="$(get_app_domain)"
BUCKET_NAME="$(get_bucket_name "$APP_NAME")"
DIST_DIR="${PROJECT_ROOT}/dist/${APP_NAME}"

# --- Check Infrastructure ---

if ! bucket_exists "$BUCKET_NAME"; then
  log_error "Infrastructure not provisioned for '${APP_NAME}'."
  log_error "Run './deploy/setup.sh ${APP_NAME}' first."
  exit 3
fi

DIST_ID="$(get_distribution_id_by_alias "$DOMAIN")"
if [[ -z "$DIST_ID" || "$DIST_ID" == "None" ]]; then
  log_error "CloudFront distribution not found for '${DOMAIN}'."
  log_error "Run './deploy/setup.sh ${APP_NAME}' first."
  exit 3
fi

# --- Build ---

log_info "Building ${APP_NAME}..."

set +e
(cd "$PROJECT_ROOT" && VITE_APP="$APP_NAME" npx vite build)
BUILD_EXIT=$?
set -e

if [[ $BUILD_EXIT -ne 0 ]]; then
  log_error "Build failed. No changes deployed. Previous version remains live."
  exit 4
fi

# --- Validate Build Output ---

if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  log_error "Build output missing: ${DIST_DIR}/index.html not found."
  exit 5
fi

FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$DIST_DIR" 2>/dev/null | cut -f1)

if [[ "$FILE_COUNT" -eq 0 ]]; then
  log_error "Build output is empty: ${DIST_DIR}/"
  exit 5
fi

log_info "Build complete. Output: dist/${APP_NAME}/ (${FILE_COUNT} files, ${TOTAL_SIZE})"

# --- Upload Assets (hashed files with long cache) ---

if [[ -d "${DIST_DIR}/assets" ]]; then
  log_info "Uploading assets to s3://${BUCKET_NAME}/assets/..."
  retry_with_backoff 3 aws s3 sync \
    "${DIST_DIR}/assets" "s3://${BUCKET_NAME}/assets" \
    --cache-control "public, max-age=31536000, immutable" \
    --delete || {
    log_error "Failed to upload assets to S3."
    exit 6
  }
fi

# --- Upload index.html (short cache) ---

log_info "Uploading index.html to s3://${BUCKET_NAME}/..."
retry_with_backoff 3 aws s3 cp \
  "${DIST_DIR}/index.html" "s3://${BUCKET_NAME}/index.html" \
  --cache-control "public, max-age=300, s-maxage=300" || {
  log_error "Failed to upload index.html to S3."
  exit 6
}

# Upload any other root-level files (favicon, manifest, etc.)
for file in "${DIST_DIR}"/*; do
  if [[ -f "$file" && "$(basename "$file")" != "index.html" ]]; then
    retry_with_backoff 3 aws s3 cp \
      "$file" "s3://${BUCKET_NAME}/$(basename "$file")" \
      --cache-control "public, max-age=300, s-maxage=300" || true
  fi
done

# --- CloudFront Invalidation ---

log_info "Invalidating CloudFront cache..."
INVALIDATION_ID=$(retry_with_backoff 3 aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/index.html" "/" \
  --query "Invalidation.Id" --output text) || {
  log_error "Failed to create CloudFront invalidation."
  exit 7
}

log_info "Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$DIST_ID" \
  --id "$INVALIDATION_ID" || {
  log_error "CloudFront invalidation timed out."
  exit 7
}

# --- Report ---

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
COMMIT=$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
APP_URL="$(get_app_url)"

echo ""
log_success "Deployment complete for '${APP_NAME}'"
echo "  URL:     ${APP_URL:-https://${DOMAIN}}"
echo "  Commit:  ${COMMIT}"
echo "  Time:    ${ELAPSED}s"
