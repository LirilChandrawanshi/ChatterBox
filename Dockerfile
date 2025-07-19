# Use OpenJDK 23 as base image
FROM openjdk:23

# Add a volume pointing to /tmp
VOLUME /tmp

# Expose port 8080
EXPOSE 8080

# The application's jar file
ARG JAR_FILE=target/chatterbox-0.0.1-SNAPSHOT.jar

# Add the application's jar to the container
ADD ${JAR_FILE} app.jar

# Run the jar file
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]

