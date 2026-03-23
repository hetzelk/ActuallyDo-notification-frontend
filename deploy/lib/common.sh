#!/usr/bin/env bash
# Shared validation, logging, and AWS helper functions for deploy scripts.

# --- Logging ---

log_info() {
  echo "[${SCRIPT_NAME:-deploy}] $*"
}

log_error() {
  echo "[${SCRIPT_NAME:-deploy}] ✗ $*" >&2
}

log_success() {
  echo "[${SCRIPT_NAME:-deploy}] ✓ $*"
}

# --- Validation ---

validate_app_name() {
  local app_name="$1"
  if [[ -z "$app_name" ]]; then
    log_error "App name is required."
    echo "Usage: $0 <app-name>" >&2
    return 1
  fi
  if [[ ! "$app_name" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]] && [[ ! "$app_name" =~ ^[a-z0-9]$ ]]; then
    log_error "Invalid app name '$app_name'. Must contain only lowercase alphanumeric characters and hyphens (no leading/trailing hyphens)."
    return 1
  fi
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" &>/dev/null; then
    log_error "Required command '$cmd' is not installed or not in PATH."
    return 1
  fi
}

# --- AWS Helpers ---

get_aws_account_id() {
  aws sts get-caller-identity --query "Account" --output text 2>/dev/null
}

get_bucket_name() {
  local app_name="$1"
  echo "${app_name}-frontend"
}

get_oac_name() {
  local app_name="$1"
  echo "${app_name}-frontend-oac"
}

bucket_exists() {
  local bucket_name="$1"
  aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null
}

get_existing_cert_arn() {
  local domain="$1"
  aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='${domain}'].CertificateArn" \
    --output text 2>/dev/null
}

get_existing_oac_id() {
  local oac_name="$1"
  aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='${oac_name}'].Id" \
    --output text 2>/dev/null
}

get_distribution_id_by_alias() {
  local domain="$1"
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items[0]=='${domain}'].Id" \
    --output text 2>/dev/null
}

get_distribution_domain() {
  local dist_id="$1"
  aws cloudfront get-distribution \
    --id "$dist_id" \
    --query "Distribution.DomainName" \
    --output text 2>/dev/null
}

get_hosted_zone_id() {
  local domain="$1"
  aws route53 list-hosted-zones-by-name \
    --dns-name "$domain" \
    --query "HostedZones[0].Id" \
    --output text 2>/dev/null | sed 's|/hostedzone/||'
}

# --- Retry ---

retry_with_backoff() {
  local max_retries="${1:-3}"
  shift
  local attempt=0
  local delay=2

  while true; do
    if "$@"; then
      return 0
    fi

    attempt=$((attempt + 1))
    if [[ $attempt -ge $max_retries ]]; then
      log_error "Command failed after $max_retries attempts: $*"
      return 1
    fi

    log_info "Attempt $attempt failed. Retrying in ${delay}s..."
    sleep "$delay"
    delay=$((delay * 2))
  done
}
