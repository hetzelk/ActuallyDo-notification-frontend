#!/usr/bin/env bash
# Environment config loader for deploy scripts.
# Loads per-app .env files and exports VITE_* variables for Vite builds.

# Resolve the deploy directory relative to this script
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_config() {
  local app_name="$1"
  local config_file="${DEPLOY_DIR}/${app_name}.env"

  if [[ ! -f "$config_file" ]]; then
    log_error "Config file not found: ${config_file}"
    log_error "Create it by copying an existing config: cp deploy/tuskdue.env deploy/${app_name}.env"
    return 2
  fi

  # Export all variables from the config file
  set -a
  # shellcheck source=/dev/null
  source "$config_file"
  set +a

  log_info "Loaded config from ${config_file}"
}

get_config_value() {
  local key="$1"
  local config_file="${DEPLOY_DIR}/${APP_NAME}.env"

  if [[ ! -f "$config_file" ]]; then
    return 1
  fi

  grep "^${key}=" "$config_file" | cut -d'=' -f2-
}

get_app_domain() {
  echo "${VITE_APP_DOMAIN:-}"
}

get_app_url() {
  echo "${VITE_APP_URL:-}"
}
