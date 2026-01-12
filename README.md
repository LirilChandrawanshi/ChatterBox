# 💬 ChatterBox - Real-time WebSocket Chat Application

A modern, feature-rich real-time chat application built with Spring Boot, WebSocket/STOMP, and a beautiful responsive UI.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.7.18-green)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue)

## ✨ Features

### Backend
- 🔌 **WebSocket Communication** - Real-time bidirectional messaging using STOMP protocol
- 👥 **Multi-user Chat** - Support for multiple concurrent users
- 📝 **Typing Indicators** - See when others are typing
- 📁 **File Sharing** - Share images up to 5MB
- 🔒 **Input Validation** - Server-side validation with Bean Validation
- 🛡️ **XSS Protection** - Input sanitization to prevent cross-site scripting
- 📊 **Health Checks** - Spring Boot Actuator endpoints for monitoring
- 🔍 **Logging** - Comprehensive logging for debugging and monitoring
- ⚠️ **Error Handling** - Global exception handling for graceful error management

### Frontend
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 😊 **Emoji Support** - Built-in emoji picker
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- ⚡ **Real-time Updates** - Instant message delivery
- 🎯 **User Avatars** - Color-coded avatars for each user
- ⏰ **Timestamps** - Message timing information
- 🔄 **Auto-scroll** - Automatic scrolling to latest messages

## 🏗️ Architecture

```
ChatterBox/
├── src/
│   ├── main/
│   │   ├── java/com/example/ChatBot/
│   │   │   ├── ChatBotApplication.java       # Main application class
│   │   │   ├── config/
│   │   │   │   ├── WebSocket.java            # WebSocket configuration
│   │   │   │   └── WebSecurityConfig.java    # CORS configuration
│   │   │   ├── controller/
│   │   │   │   ├── ChatBotController.java    # Message handling endpoints
│   │   │   │   └── SocketEventListener.java  # WebSocket event listeners
│   │   │   ├── model/
│   │   │   │   └── Entity.java               # Message entity model
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java # Error handling
│   │   └── resources/
│   │       ├── application.properties         # Development configuration
│   │       ├── application-production.properties # Production configuration
│   │       └── static/
│   │           └── index.html                 # Frontend application
│   └── test/
│       └── java/com/example/ChatBot/
│           └── WebsocketDemoApplicationTests.java # Tests
├── Dockerfile                                 # Docker configuration
├── k8s-deployment.yaml                        # Kubernetes deployment
└── pom.xml                                    # Maven dependencies
```

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+ (or use the included Maven wrapper)
- Docker (optional, for containerization)
- Kubernetes (optional, for orchestration)

### Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChatterBox
   ```

2. **Build the project**
   ```bash
   ./mvnw clean package
   ```

3. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Access the application**
   
   Open your browser and navigate to: `http://localhost:8080`

### Running with Docker

1. **Build the Docker image**
   ```bash
   docker build -t chatterbox:latest .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 chatterbox:latest
   ```

3. **Access the application**
   
   Open your browser and navigate to: `http://localhost:8080`

### Deploying to Kubernetes

1. **Update the image name in k8s-deployment.yaml**
   
   Replace `yourusername/chatterbox:0.0.1-SNAPSHOT` with your Docker Hub username

2. **Build and push the Docker image**
   ```bash
   docker build -t yourusername/chatterbox:0.0.1-SNAPSHOT .
   docker push yourusername/chatterbox:0.0.1-SNAPSHOT
   ```

3. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

4. **Check the deployment**
   ```bash
   kubectl get pods
   kubectl get services
   ```

5. **Access the application**
   
   Get the service URL and access the application through your browser

## 🔧 Configuration

### Application Properties

Key configuration options in `application.properties`:

```properties
# Server port
server.port=8080

# WebSocket message size limit (512KB)
spring.websocket.message-size-limit=524288

# File upload size limit (5MB)
spring.servlet.multipart.max-file-size=5MB

# Logging level
logging.level.com.example.ChatBot=DEBUG
```

### Production Profile

For production deployment, use the production profile:

```bash
java -jar target/chatterbox-0.0.1-SNAPSHOT.jar --spring.profiles.active=production
```

Or set the environment variable in Docker/Kubernetes:
```yaml
env:
  - name: SPRING_PROFILES_ACTIVE
    value: "production"
```

## 🧪 Testing

Run the test suite:

```bash
./mvnw test
```

The test suite includes:
- Context loading tests
- WebSocket connection tests
- Message sending/receiving tests
- Entity model validation tests

## 📊 Monitoring

Health check endpoint:
```
http://localhost:8080/actuator/health
```

Available actuator endpoints (production profile):
- `/actuator/health` - Application health status
- `/actuator/info` - Application information
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics

## 🔒 Security Features

- **Input Validation** - Bean Validation on all message entities
- **XSS Protection** - HTML escaping for user-generated content
- **CORS Configuration** - Controlled cross-origin resource sharing
- **File Size Limits** - Both client and server-side file size validation
- **Non-root Docker User** - Container runs as non-privileged user
- **Resource Limits** - Kubernetes resource constraints

## 🛠️ Technology Stack

- **Backend Framework**: Spring Boot 2.7.18
- **WebSocket**: STOMP over SockJS
- **Build Tool**: Maven
- **Java Version**: 17
- **Frontend**: HTML5, JavaScript (ES6), Tailwind CSS
- **Containerization**: Docker with Eclipse Temurin JRE
- **Orchestration**: Kubernetes
- **Testing**: JUnit 5, Spring Test

## 📝 API Endpoints

### WebSocket Endpoints

- **Connect**: `/ws` - WebSocket connection endpoint (SockJS)
- **Send Message**: `/app/chat.sendMessage` - Send a chat message
- **Add User**: `/app/chat.addUser` - Join the chat
- **Typing**: `/app/chat.typing` - Notify typing status
- **Send File**: `/app/chat.sendFile` - Share a file

### Subscriptions

- **Public Channel**: `/topic/public` - Subscribe to receive all messages
- **Errors**: `/queue/errors` - Subscribe to receive error messages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ using Spring Boot and WebSocket

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   
   Change the port in `application.properties`:
   ```properties
   server.port=8081
   ```

2. **WebSocket connection fails**
   
   - Check if the application is running
   - Verify firewall settings
   - Check browser console for errors

3. **File upload fails**
   
   - Verify file size is under 5MB
   - Check supported file types (png, jpg, jpeg, gif)

4. **Docker build fails**
   
   - Ensure Maven build completes successfully first
   - Verify the JAR file exists in `target/` directory

## 🔄 Updates

### Version 0.0.1-SNAPSHOT

- ✅ Initial release
- ✅ Real-time chat functionality
- ✅ File sharing support
- ✅ Typing indicators
- ✅ Dark mode
- ✅ Docker support
- ✅ Kubernetes deployment
- ✅ Comprehensive testing
- ✅ Production-ready configuration

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions

---

**Note**: Before deploying to production, make sure to:
1. Replace the Docker Hub username in `pom.xml` and `k8s-deployment.yaml`
2. Configure proper CORS origins in `WebSecurityConfig.java`
3. Set up proper logging and monitoring
4. Review and adjust resource limits in Kubernetes deployment
5. Configure SSL/TLS for secure WebSocket connections (WSS)
