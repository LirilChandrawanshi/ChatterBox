package com.example.ChatBot;

import com.example.ChatBot.model.Entity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class WebsocketDemoApplicationTests {

	@LocalServerPort
	private int port;

	private String wsUrl;
	private WebSocketStompClient stompClient;
	private final CompletableFuture<Entity> completableFuture = new CompletableFuture<>();

	@BeforeEach
	public void setup() {
		wsUrl = "http://localhost:" + port + "/ws";
		
		List<Transport> transports = new ArrayList<>();
		transports.add(new WebSocketTransport(new StandardWebSocketClient()));
		SockJsClient sockJsClient = new SockJsClient(transports);
		
		stompClient = new WebSocketStompClient(sockJsClient);
		stompClient.setMessageConverter(new MappingJackson2MessageConverter());
	}

	@Test
	public void contextLoads() {
		// Verify that the application context loads successfully
		assertNotNull(stompClient);
	}

	@Test
	public void testWebSocketConnection() throws ExecutionException, InterruptedException, TimeoutException {
		// Test WebSocket connection
		StompSession session = stompClient
				.connect(wsUrl, new StompSessionHandlerAdapter() {})
				.get(5, TimeUnit.SECONDS);
		
		assertNotNull(session);
		assertTrue(session.isConnected());
		
		session.disconnect();
	}

	@Test
	public void testSendMessage() throws ExecutionException, InterruptedException, TimeoutException {
		// Connect to WebSocket
		StompSession session = stompClient
				.connect(wsUrl, new StompSessionHandlerAdapter() {})
				.get(5, TimeUnit.SECONDS);
		
		// Subscribe to the public topic
		session.subscribe("/topic/public", new StompFrameHandler() {
			@Override
			public Type getPayloadType(StompHeaders headers) {
				return Entity.class;
			}

			@Override
			public void handleFrame(StompHeaders headers, Object payload) {
				completableFuture.complete((Entity) payload);
			}
		});

		// Send a test message
		Entity testMessage = new Entity();
		testMessage.setType(Entity.MessageType.CHAT);
		testMessage.setContent("Test message");
		testMessage.setSender("TestUser");
		
		session.send("/app/chat.sendMessage", testMessage);

		// Wait for the message to be received
		Entity receivedMessage = completableFuture.get(5, TimeUnit.SECONDS);
		
		assertNotNull(receivedMessage);
		assertEquals("Test message", receivedMessage.getContent());
		assertEquals("TestUser", receivedMessage.getSender());
		assertEquals(Entity.MessageType.CHAT, receivedMessage.getType());
		assertTrue(receivedMessage.getTimestamp() > 0);
		
		session.disconnect();
	}

	@Test
	public void testEntityModel() {
		// Test Entity model getters and setters
		Entity entity = new Entity();
		entity.setType(Entity.MessageType.JOIN);
		entity.setContent("Hello");
		entity.setSender("User1");
		entity.setTimestamp(System.currentTimeMillis());
		
		assertEquals(Entity.MessageType.JOIN, entity.getType());
		assertEquals("Hello", entity.getContent());
		assertEquals("User1", entity.getSender());
		assertTrue(entity.getTimestamp() > 0);
	}

	@Test
	public void testMessageTypes() {
		// Test all message types are available
		assertNotNull(Entity.MessageType.CHAT);
		assertNotNull(Entity.MessageType.JOIN);
		assertNotNull(Entity.MessageType.LEAVE);
		assertNotNull(Entity.MessageType.TYPING);
		assertNotNull(Entity.MessageType.FILE);
		
		assertEquals(5, Entity.MessageType.values().length);
	}
}
