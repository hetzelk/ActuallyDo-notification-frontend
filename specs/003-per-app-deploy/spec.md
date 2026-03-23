# Feature Specification: Per-App Deployment Infrastructure

**Feature Branch**: `003-per-app-deploy`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Per-app deployment infrastructure with setup, deploy/redeploy scripts, and GitHub Actions for independently deploying each frontend app (TuskDue, WrenchDue, future apps) to S3 + CloudFront."

## Clarifications

### Session 2026-03-23

- Q: How is per-app source code organized in the repository? → A: Single `src/` with per-app entry points (`src/apps/tuskdue/main.tsx`, `src/apps/wrenchdue/main.tsx`) and shared code in `src/`.
- Q: Where is the per-app configuration stored? → A: Dedicated config directory with a file per app (`deploy/tuskdue.env`, `deploy/wrenchdue.env`).
- Q: Should deploy scripts handle SSL/TLS certificate provisioning for each app's custom domain? → A: Yes — the setup script provisions SSL certificates automatically via ACM (AWS Certificate Manager) as part of infrastructure setup.
- Q: How should the deploy script handle the cache invalidation wait time? → A: Wait for completion — the deploy script blocks until CloudFront confirms full cache propagation before exiting successfully.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy a New App for the First Time (Priority: P1)

A developer has finished building a new frontend app (e.g., TuskDue) and wants to make it publicly accessible. They run a one-time setup script that provisions the necessary cloud hosting infrastructure for that specific app, then deploy the built frontend so users can access it at the app's URL.

**Why this priority**: Without initial infrastructure provisioning, no app can be deployed at all. This is the foundational capability everything else depends on.

**Independent Test**: Can be fully tested by running the setup script for a new app name and verifying the hosting infrastructure is created and accessible.

**Acceptance Scenarios**:

1. **Given** a developer has a built frontend app named "tuskdue", **When** they run the infrastructure setup script with "tuskdue" as the app name, **Then** the hosting infrastructure is created and the script outputs the distribution URL and bucket details.
2. **Given** the infrastructure for "tuskdue" has been provisioned, **When** the developer runs the deploy script with "tuskdue", **Then** the app is built, assets are uploaded, the cache is invalidated, and the app is accessible at its URL.
3. **Given** setup has already been run for "tuskdue", **When** the developer runs the setup script again for "tuskdue", **Then** the script detects existing infrastructure and exits gracefully without duplicating resources.

---

### User Story 2 - Redeploy an Existing App After Code Changes (Priority: P1)

A developer has made changes to an existing app and wants to push the updated version live. They run a deploy script that rebuilds the app, uploads the new assets, and invalidates the content cache so users see the latest version immediately.

**Why this priority**: Redeployment is the most frequently used operation — every code change requires it. Equal priority to initial setup since both are essential.

**Independent Test**: Can be tested by modifying a visible element in the app, running the deploy script, and verifying the change is live within minutes.

**Acceptance Scenarios**:

1. **Given** an app "tuskdue" is currently deployed, **When** a developer makes code changes and runs the deploy script for "tuskdue", **Then** the app is rebuilt with the latest code, new assets replace old ones, and the cache is invalidated.
2. **Given** an app "wrenchdue" is deployed, **When** the developer runs the deploy script for "wrenchdue", **Then** only WrenchDue's hosting is updated — TuskDue remains unaffected.
3. **Given** a deploy is in progress, **When** the build step fails (e.g., compilation error), **Then** the script stops before uploading anything and reports the error clearly. The previously deployed version remains live.

---

### User Story 3 - Automated Deployment on Code Push (Priority: P2)

When a developer pushes code changes to the main branch, the system automatically detects which app(s) were modified and deploys only those apps. This eliminates the need for manual deploys after merging pull requests.

**Why this priority**: Automation is highly valuable for team productivity but requires manual deploy scripts to exist first. It builds on the P1 capabilities.

**Independent Test**: Can be tested by pushing a change to the main branch that modifies an app-specific file and verifying only that app is automatically redeployed.

**Acceptance Scenarios**:

1. **Given** a developer pushes changes to `main` that include modifications to TuskDue files, **When** the automated pipeline runs, **Then** only TuskDue is rebuilt and deployed — WrenchDue is not affected.
2. **Given** a developer pushes changes to `main` that modify shared code used by both apps, **When** the automated pipeline runs, **Then** both TuskDue and WrenchDue are rebuilt and deployed.
3. **Given** a developer needs to redeploy an app without code changes (e.g., environment variable update), **When** they manually trigger the pipeline and select the target app, **Then** only that app is rebuilt and deployed.

---

### User Story 4 - Add a New Niche App to the Platform (Priority: P3)

In the future, a developer creates a new niche frontend app beyond TuskDue and WrenchDue. They can provision and deploy it using the same scripts without modifying any deployment tooling — just by passing a new app name.

**Why this priority**: Future-proofing is important but not blocking. The scripts should be designed generically from the start so this works automatically.

**Independent Test**: Can be tested by inventing a new app name (e.g., "gardendue"), running setup and deploy, and verifying it works identically to existing apps.

**Acceptance Scenarios**:

1. **Given** a new app "gardendue" has been developed, **When** the developer runs the setup script with "gardendue", **Then** infrastructure is provisioned following the same pattern as existing apps.
2. **Given** the new app has been set up, **When** the developer adds the app name to the CI/CD configuration, **Then** automated deployments work for the new app using the same pipeline as existing apps.

---

### Edge Cases

- What happens when the deploy script is run for an app name that has no infrastructure provisioned? The script should detect this and exit with a clear error message directing the user to run the setup script first.
- What happens when the cloud provider API rate-limits or throttles requests during deployment? The scripts should retry transient failures with exponential backoff and report persistent failures clearly.
- What happens when the build produces no output (empty dist directory)? The deploy script should detect this and abort before uploading, preventing a blank site from going live.
- What happens when two deployments of the same app run concurrently (e.g., two pushes to main in quick succession)? The CI/CD pipeline should serialize deployments per app to prevent race conditions.
- What happens when the app name contains invalid characters for cloud resource naming? The setup script should validate the app name upfront and reject names with spaces, uppercase, or special characters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a one-time infrastructure setup command that provisions hosting resources for a named app, with the app's custom domain configured via its environment configuration.
- **FR-002**: The system MUST provide a deploy command that builds a specified app, uploads built assets to the app's hosting, invalidates the content cache, and waits for the invalidation to complete before reporting success.
- **FR-003**: The deploy command MUST apply long-lived cache headers (1 year) to hashed/fingerprinted assets and short-lived cache headers (5 minutes) to the root HTML document.
- **FR-004**: The deploy command MUST exit with a non-zero status and a clear error message if the build fails, without modifying the currently deployed version.
- **FR-005**: The setup script MUST be idempotent — running it for an already-provisioned app does not create duplicate resources or fail.
- **FR-006**: Each app MUST have its own environment configuration file in a centralized `deploy/` directory (e.g., `deploy/tuskdue.env`) containing app-specific settings (domain, API URLs, publishable keys, feature flags) that are injected at build time.
- **FR-007**: The system MUST provide an automated CI/CD pipeline that deploys the correct app(s) when code is pushed to the main branch, based on which files changed.
- **FR-008**: The CI/CD pipeline MUST support manual triggering with an app-name selector for on-demand deployments.
- **FR-009**: Deploying one app MUST NOT affect any other app's hosting, cache, or availability.
- **FR-010**: The deploy command MUST validate that infrastructure exists for the target app before attempting to upload, and provide a clear error if it does not.
- **FR-011**: App names MUST be validated to contain only lowercase alphanumeric characters and hyphens.
- **FR-012**: The CI/CD pipeline MUST serialize concurrent deployments of the same app to prevent race conditions.
- **FR-013**: The setup script MUST provision an SSL/TLS certificate via AWS Certificate Manager (ACM) for the app's custom domain and attach it to the CloudFront distribution automatically.

### Key Entities

- **App**: A named frontend application (e.g., "tuskdue", "wrenchdue") that maps 1:1 to a hosting infrastructure instance and a build configuration. Key attributes: app name, domain, environment configuration.
- **Deployment**: A single execution of build + upload + cache invalidation for one app. Key attributes: app name, timestamp, commit hash, success/failure status.
- **Infrastructure Instance**: The cloud hosting resources for one app (storage bucket, content distribution, domain mapping). Key attributes: app name, bucket identifier, distribution identifier, domain.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can provision hosting for a new app and deploy it in under 10 minutes using only the provided scripts.
- **SC-002**: A code change pushed to the main branch is live on the affected app within 5 minutes without manual intervention.
- **SC-003**: Deploying one app has zero impact on other apps — no downtime, no cache invalidation, no configuration changes to unrelated apps.
- **SC-004**: A new niche app can be added to the platform and deployed without modifying any existing deployment scripts or pipeline definitions — only configuration changes are needed.
- **SC-005**: Failed deployments leave the previously deployed version fully intact and accessible to users.
- **SC-006**: 100% of deployments are traceable — every deployment records which app, which commit, and whether it succeeded or failed.

## Assumptions

- Each app has its own independent domain (e.g., `tuskdue.com`, `wrenchdue.com`) with DNS managed by the team.
- Cloud provider credentials are available as secrets in the CI/CD environment and on developer machines (for manual deploys).
- Each app has its own Vite build configuration or entry point that can be built independently.
- The repository uses a single `src/` directory with per-app entry points under `src/apps/{app-name}/main.tsx` and shared platform code in `src/`. Each app has its own Vite config or build target referencing its entry point.
- Production is the only deployment environment for now; staging/preview environments may be added later but are out of scope.
