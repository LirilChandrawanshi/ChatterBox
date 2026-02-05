# Stage 1: Build the JAR with Maven (so the JAR exists when Render clones the repo)
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom first for better layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build the JAR
COPY src src
RUN ./mvnw package -DskipTests -B

# Stage 2: Runtime image (only the JAR + JRE)
FROM eclipse-temurin:17-jre-alpine

# Add metadata
LABEL maintainer="chatterbox@example.com"
LABEL description="ChatterBox - Real-time WebSocket Chat Application"
LABEL version="0.0.1-SNAPSHOT"

# Note: Do not use VOLUME here — Railway bans VOLUME in Dockerfiles.

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/target/chatterbox-0.0.1-SNAPSHOT.jar app.jar

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

