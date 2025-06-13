FROM eclipse-temurin:17-jdk AS build

# Install Node.js 23 and pnpm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_23.x | bash - && \
    apt-get install -y nodejs && \
    corepack enable && \
    corepack prepare pnpm@latest --activate && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /nimtable

# Copy Gradle files && download gradle
COPY backend/gradlew backend/gradle.properties backend/settings.gradle /nimtable/backend/
COPY backend/gradle/ /nimtable/backend/gradle/
RUN cd /nimtable/backend && ./gradlew


# Only copy dependency-related files
COPY backend/build.gradle /nimtable/backend/
# Pre-download Gradle dependencies
RUN cd /nimtable/backend && ./gradlew downloadDependencies --no-daemon


# Copy package files for pnpm dependency download
COPY package.json pnpm-lock.yaml ./
# Pre-download pnpm dependencies
RUN pnpm install --frozen-lockfile


# Copy project files
COPY . .
# Generate Prisma client for frontend
RUN pnpm prisma generate
# Build frontend
RUN pnpm run build
# Build backend
RUN cd /nimtable/backend && ./gradlew build --no-daemon


# Runtime image
FROM eclipse-temurin:17-jre-jammy AS nimtable

WORKDIR /nimtable

# Copy the built artifact
COPY --from=build /nimtable/backend/build/libs/nimtable-all.jar /nimtable/nimtable.jar

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
