# Nimtable Helm chart

This chart deploys the Nimtable web application, backend, and (by default) a
single PostgreSQL StatefulSet.

## Install

Choose non-default credentials and install the chart:

```bash
helm install nimtable ./charts/nimtable \
  --set-string auth.jwtSecret='replace-with-a-long-random-value' \
  --set-string auth.adminPassword='replace-with-a-strong-password' \
  --set-string postgresql.auth.password='replace-with-a-strong-password'
```

Wait for the deployments and access the web service:

```bash
kubectl rollout status deployment/nimtable-backend
kubectl rollout status deployment/nimtable-web
kubectl port-forward service/nimtable-web 3000:3000
```

Open <http://localhost:3000> and sign in with the configured admin credentials.

## Use an external PostgreSQL database

Disable the bundled StatefulSet and configure the external server:

```bash
helm install nimtable ./charts/nimtable \
  --set postgresql.enabled=false \
  --set externalDatabase.host=postgres.example.com \
  --set externalDatabase.username=nimtable \
  --set-string externalDatabase.password='replace-with-a-strong-password' \
  --set externalDatabase.database=nimtable \
  --set-string auth.jwtSecret='replace-with-a-long-random-value' \
  --set-string auth.adminPassword='replace-with-a-strong-password'
```

The database must already exist and be reachable from both Nimtable
deployments. Nimtable runs its own schema migrations when it starts.

## Configuration

| Value | Description | Default |
| --- | --- | --- |
| `web.image.repository` | Web image repository | `ghcr.io/nimtable/nimtable-web` |
| `web.image.tag` | Web image tag; defaults to `appVersion` | `""` |
| `backend.image.repository` | Backend image repository | `ghcr.io/nimtable/nimtable` |
| `backend.image.tag` | Backend image tag; defaults to `appVersion` | `""` |
| `backend.catalogs` | Catalog entries written to the backend `config.yaml` | `[]` |
| `auth.jwtSecret` | Secret used to sign login tokens | `change-me` |
| `auth.adminUsername` | Initial administrator username | `admin` |
| `auth.adminPassword` | Initial administrator password | `admin` |
| `postgresql.enabled` | Deploy the bundled PostgreSQL StatefulSet | `true` |
| `postgresql.persistence.enabled` | Persist the bundled database | `true` |
| `postgresql.persistence.size` | Database volume size | `8Gi` |
| `externalDatabase.*` | External database connection settings | See `values.yaml` |
| `ingress.enabled` | Create an Ingress for the web service | `false` |

See [`values.yaml`](values.yaml) for the complete set of values. Credentials
are stored in a Kubernetes Secret, but Helm values themselves are not encrypted;
use your cluster's normal secret-management workflow for production releases.
