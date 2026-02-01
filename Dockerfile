# Use Eclipse Temurin JDK 17 as base image (recommended for production)
FROM eclipse-temurin:17-jre-alpine

# Add metadata
LABEL maintainer="chatterbox@example.com"
LABEL description="ChatterBox - Real-time WebSocket Chat Application"
LABEL version="0.0.1-SNAPSHOT"

# Note: Do not use VOLUME here — Railway bans VOLUME in Dockerfiles.

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# The application's jar file
ARG JAR_FILE=target/chatterbox-0.0.1-SNAPSHOT.jar

# Copy the application's jar to the container
COPY ${JAR_FILE} app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port 8080
EXPOSE 8080

# Run the jar file with optimized JVM settings
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", \
    "app.jar"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

