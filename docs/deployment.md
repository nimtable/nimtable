# Backend deployment model

Nimtable supports exactly **one backend replica per PostgreSQL database**. The web frontend may be deployed separately, but the Java backend is not horizontally scalable.

This constraint exists because the backend owns three process-local responsibilities:

- scheduled maintenance polling and execution;
- an embedded Spark session running with `local[*]`;
- REST catalog adapters reconstructed from `config.yaml` and PostgreSQL.

## Enforcement

At startup, the backend obtains a PostgreSQL session advisory lock on a dedicated database connection before it starts Spark, registers catalogs, or starts the scheduler. If another backend connected to the same database already owns the lock, startup fails with a clear error. PostgreSQL releases the lock if the connection or process terminates.

The supplied Docker Compose deployment also declares one backend replica. Other orchestrators must likewise configure the backend workload with a replica count of one. The database lock remains the authoritative safeguard against an accidental second replica.

`GET /api/status` reports the deployment mode and lock state. It returns HTTP 200 while the lock-owning connection is healthy and HTTP 503 if ownership has been lost. Scheduled polling also stops when the lock is no longer healthy.

## Catalog reconciliation

Catalog adapters are fully reconstructed before scheduled work starts. Catalogs stored in PostgreSQL are loaded in name order and take precedence over a `config.yaml` entry with the same name, matching the catalog API and Spark configuration behavior. A catalog declared only in `config.yaml` is declarative: disconnecting it through the API hides it for the current process, and restarting the backend restores it from the file.

## Operational implications

Spark queries and scheduled maintenance share the backend process and its CPU and memory. Size the single backend for both API and maintenance workloads, and use the status endpoint as its readiness check. External compute/job-runner isolation would require a separate execution protocol and is not part of the currently supported model.
