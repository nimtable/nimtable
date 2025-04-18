# Runtime image
FROM eclipse-temurin:17-jre-jammy AS nimtable

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
