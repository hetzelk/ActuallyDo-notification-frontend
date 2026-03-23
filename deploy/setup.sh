#!/usr/bin/env bash
# One-time infrastructure provisioning for a frontend app.
#
# Usage: ./deploy/setup.sh <app-name>
#
# Provisions: S3 bucket, CloudFront OAC, ACM certificate (with DNS validation),
# CloudFront distribution, S3 bucket policy, and Route 53 DNS record.
#
# Idempotent: safe to re-run — detects existing resources and skips creation.
#
# To add a new app:
#   1. Create deploy/<app-name>.env with VITE_APP_DOMAIN and other VITE_* vars
#   2. Create src/apps/<app-name>/index.html and main.tsx
#   3. Run: ./deploy/setup.sh <app-name>
#   4. Run: ./deploy/deploy.sh <app-name>
set -euo pipefail

SCRIPT_NAME="setup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/config.sh
source "${SCRIPT_DIR}/lib/config.sh"

# --- Main ---

APP_NAME="${1:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

validate_app_name "$APP_NAME" || exit 1
require_command "aws" || exit 1

load_config "$APP_NAME" || exit 2

DOMAIN="$(get_app_domain)"
if [[ -z "$DOMAIN" ]]; then
  log_error "VITE_APP_DOMAIN is not set in deploy/${APP_NAME}.env"
  exit 2
fi

BUCKET_NAME="$(get_bucket_name "$APP_NAME")"
OAC_NAME="$(get_oac_name "$APP_NAME")"
ACCOUNT_ID="$(get_aws_account_id)"

if [[ -z "$ACCOUNT_ID" ]]; then
  log_error "Failed to get AWS account ID. Check your AWS credentials."
  exit 3
fi

# Track whether all infrastructure already exists
ALL_EXIST=true

# --- S3 Bucket ---

if bucket_exists "$BUCKET_NAME"; then
  log_info "S3 bucket '$BUCKET_NAME' already exists."
else
  ALL_EXIST=false
  log_info "Creating S3 bucket '$BUCKET_NAME'..."
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    retry_with_backoff 3 aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" || exit 3
  else
    retry_with_backoff 3 aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}" || exit 3
  fi

  retry_with_backoff 3 aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" || exit 3

  log_success "S3 bucket created: $BUCKET_NAME"
fi

# --- Origin Access Control ---

OAC_ID="$(get_existing_oac_id "$OAC_NAME")"
if [[ -n "$OAC_ID" && "$OAC_ID" != "None" ]]; then
  log_info "OAC '$OAC_NAME' already exists (ID: $OAC_ID)."
else
  ALL_EXIST=false
  log_info "Creating Origin Access Control '$OAC_NAME'..."
  OAC_ID=$(retry_with_backoff 3 aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
      \"Name\": \"${OAC_NAME}\",
      \"Description\": \"OAC for ${BUCKET_NAME}\",
      \"SigningProtocol\": \"sigv4\",
      \"SigningBehavior\": \"always\",
      \"OriginAccessControlOriginType\": \"s3\"
    }" \
    --query "OriginAccessControl.Id" --output text) || exit 3
  log_success "OAC created: $OAC_ID"
fi

# --- ACM Certificate ---

CERT_ARN="$(get_existing_cert_arn "$DOMAIN")"
if [[ -n "$CERT_ARN" && "$CERT_ARN" != "None" ]]; then
  log_info "ACM certificate for '$DOMAIN' already exists."
else
  ALL_EXIST=false
  log_info "Requesting ACM certificate for '$DOMAIN'..."
  CERT_ARN=$(retry_with_backoff 3 aws acm request-certificate \
    --region us-east-1 \
    --domain-name "$DOMAIN" \
    --validation-method DNS \
    --query "CertificateArn" --output text) || exit 3

  log_info "Waiting for DNS validation record..."
  sleep 5

  VALIDATION_RECORD=$(aws acm describe-certificate \
    --region us-east-1 \
    --certificate-arn "$CERT_ARN" \
    --query "Certificate.DomainValidationOptions[0].ResourceRecord" \
    --output json 2>/dev/null)

  VALIDATION_NAME=$(echo "$VALIDATION_RECORD" | grep -o '"Name":"[^"]*"' | cut -d'"' -f4)
  VALIDATION_VALUE=$(echo "$VALIDATION_RECORD" | grep -o '"Value":"[^"]*"' | cut -d'"' -f4)

  if [[ -n "$VALIDATION_NAME" && -n "$VALIDATION_VALUE" ]]; then
    ZONE_ID="$(get_hosted_zone_id "$DOMAIN")"
    if [[ -n "$ZONE_ID" && "$ZONE_ID" != "None" ]]; then
      log_info "Creating DNS validation record in Route 53..."
      aws route53 change-resource-record-sets \
        --hosted-zone-id "$ZONE_ID" \
        --change-batch "{
          \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
              \"Name\": \"${VALIDATION_NAME}\",
              \"Type\": \"CNAME\",
              \"TTL\": 300,
              \"ResourceRecords\": [{\"Value\": \"${VALIDATION_VALUE}\"}]
            }
          }]
        }" >/dev/null || log_error "Failed to create DNS validation record. Create it manually."
    else
      log_info "Route 53 hosted zone not found for '$DOMAIN'."
      log_info "Create a CNAME record manually:"
      log_info "  Name:  $VALIDATION_NAME"
      log_info "  Value: $VALIDATION_VALUE"
    fi

    log_info "Waiting for certificate validation (this may take several minutes)..."
    aws acm wait certificate-validated \
      --region us-east-1 \
      --certificate-arn "$CERT_ARN" || {
      log_error "Certificate validation timed out. Check DNS and retry."
      exit 3
    }
    log_success "ACM certificate validated: $CERT_ARN"
  else
    log_error "Could not retrieve DNS validation record. Check the certificate in the AWS console."
    exit 3
  fi
fi

# --- CloudFront Distribution ---

DIST_ID="$(get_distribution_id_by_alias "$DOMAIN")"
if [[ -n "$DIST_ID" && "$DIST_ID" != "None" ]]; then
  log_info "CloudFront distribution for '$DOMAIN' already exists (ID: $DIST_ID)."
else
  ALL_EXIST=false
  log_info "Creating CloudFront distribution for '$DOMAIN'..."

  CALLER_REF="setup-${APP_NAME}-$(date +%s)"
  DIST_CONFIG=$(cat <<DISTEOF
{
  "CallerReference": "${CALLER_REF}",
  "Aliases": {
    "Quantity": 1,
    "Items": ["${DOMAIN}"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-${BUCKET_NAME}",
      "DomainName": "${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com",
      "OriginAccessControlId": "${OAC_ID}",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "${CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true,
  "HttpVersion": "http2and3",
  "Comment": "Frontend distribution for ${DOMAIN}"
}
DISTEOF
)

  DIST_RESULT=$(echo "$DIST_CONFIG" | retry_with_backoff 3 aws cloudfront create-distribution \
    --distribution-config file:///dev/stdin \
    --query "Distribution.{Id:Id,DomainName:DomainName}" \
    --output json) || exit 3

  DIST_ID=$(echo "$DIST_RESULT" | grep -o '"Id":"[^"]*"' | cut -d'"' -f4)
  CF_DOMAIN=$(echo "$DIST_RESULT" | grep -o '"DomainName":"[^"]*"' | cut -d'"' -f4)

  log_success "CloudFront distribution created: $DIST_ID ($CF_DOMAIN)"
fi

# --- S3 Bucket Policy ---

log_info "Setting S3 bucket policy for CloudFront access..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"AllowCloudFrontServicePrincipal\",
      \"Effect\": \"Allow\",
      \"Principal\": {
        \"Service\": \"cloudfront.amazonaws.com\"
      },
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\",
      \"Condition\": {
        \"StringEquals\": {
          \"AWS:SourceArn\": \"arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}\"
        }
      }
    }]
  }" 2>/dev/null || log_info "Bucket policy already set or update skipped."

# --- Route 53 DNS Record ---

ZONE_ID="$(get_hosted_zone_id "$DOMAIN")"
if [[ -n "$ZONE_ID" && "$ZONE_ID" != "None" ]]; then
  log_info "Creating Route 53 A ALIAS record for '$DOMAIN'..."
  aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch "{
      \"Changes\": [{
        \"Action\": \"UPSERT\",
        \"ResourceRecordSet\": {
          \"Name\": \"${DOMAIN}\",
          \"Type\": \"A\",
          \"AliasTarget\": {
            \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
            \"DNSName\": \"$(get_distribution_domain "$DIST_ID")\",
            \"EvaluateTargetHealth\": false
          }
        }
      }]
    }" >/dev/null || log_error "Failed to create Route 53 record."
  log_success "Route 53 record created for $DOMAIN"
else
  log_info "No Route 53 hosted zone found for '$DOMAIN'."
  CF_DOMAIN="$(get_distribution_domain "$DIST_ID")"
  log_info "Create a CNAME record at your DNS provider:"
  log_info "  ${DOMAIN} -> ${CF_DOMAIN}"
fi

# --- Summary ---

CF_DOMAIN="$(get_distribution_domain "$DIST_ID")"

if [[ "$ALL_EXIST" == "true" ]]; then
  echo ""
  log_info "Infrastructure for '${APP_NAME}' already exists. No changes made."
  echo "  S3 bucket:     $BUCKET_NAME"
  echo "  CloudFront:    $CF_DOMAIN"
  echo "  Domain:        $DOMAIN"
else
  echo ""
  log_success "Infrastructure for '${APP_NAME}' is ready."
  echo "  S3 bucket:     $BUCKET_NAME"
  echo "  CloudFront:    $CF_DOMAIN"
  echo "  Domain:        $DOMAIN"
  echo "  Certificate:   $CERT_ARN"
fi
