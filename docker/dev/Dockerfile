# Runtime image
FROM eclipse-temurin:17-jre-jammy AS nimtable-backend-runtime

WORKDIR /nimtable

# Copy the built artifact
COPY ./nimtable-all.jar /nimtable/nimtable.jar

# Expose the application port
EXPOSE 8182

# Run the application
ENTRYPOINT ["java", \
    "--add-opens=java.base/java.lang=ALL-UNNAMED", \
    "--add-opens=java.base/java.lang.invoke=ALL-UNNAMED", \
    "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED", \
    "--add-opens=java.base/java.io=ALL-UNNAMED", \
    "--add-opens=java.base/java.net=ALL-UNNAMED", \
    "--add-opens=java.base/java.nio=ALL-UNNAMED", \
    "--add-opens=java.base/java.util=ALL-UNNAMED", \
    "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED", \
    "--add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED", \
    "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED", \
    "--add-opens=java.base/sun.nio.cs=ALL-UNNAMED", \
    "--add-opens=java.base/sun.security.action=ALL-UNNAMED", \
    "--add-opens=java.base/sun.util.calendar=ALL-UNNAMED", \
    "--add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED", \
    "-jar", "/nimtable/nimtable.jar"] 

FROM node:23-alpine AS nimtable-frontend-runtime

# https://github.com/vercel/next.js/blob/canary/examples/with-docker-compose/next-app/dev.Dockerfile

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  # Allow install without lockfile, so example works even without Node.js installed locally
  else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
  fi

COPY src ./src
COPY public ./public
COPY prisma ./prisma
COPY *config* .

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at run time
# ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

RUN pnpm prisma generate

# Start Next.js in development mode based on the preferred package manager
CMD \
  if [ -f yarn.lock ]; then yarn dev; \
  elif [ -f package-lock.json ]; then npm run dev; \
  elif [ -f pnpm-lock.yaml ]; then pnpm dev; \
  else npm run dev; \
  fi


  FROM apache/iceberg-rest-fixture AS rest

  # Switch to root to install packages and download JDBC driver
  USER root
  
  # Install wget and download PostgreSQL JDBC driver
  RUN apt-get update && \
      apt-get install -y --no-install-recommends wget && \
      wget -O /usr/lib/iceberg-rest/postgresql.jar https://jdbc.postgresql.org/download/postgresql-42.7.1.jar && \
      apt-get remove -y wget && \
      apt-get autoremove -y && \
      rm -rf /var/lib/apt/lists/*
  
  # Configure for PostgreSQL (defaults, can be overridden by compose)
  ENV CATALOG_CATALOG__IMPL=org.apache.iceberg.jdbc.JdbcCatalog
  ENV CATALOG_URI=jdbc:postgresql://database:5432/restcatalog
  ENV CATALOG_JDBC_USER=nimtable_user
  ENV CATALOG_JDBC_PASSWORD=password
  
  # Switch back to iceberg user
  USER iceberg:iceberg
  
  # Override CMD to include PostgreSQL driver in classpath
  CMD ["java", "-cp", "iceberg-rest-adapter.jar:postgresql.jar", "org.apache.iceberg.rest.RESTCatalogServer"]
