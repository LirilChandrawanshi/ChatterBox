package com.example.ChatBot;

import com.example.ChatBot.dto.chat.ChatMessageRequest;
import com.example.ChatBot.dto.chat.ChatMessageResponse;
import com.example.ChatBot.model.MessageType;
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
	private final CompletableFuture<ChatMessageResponse> completableFuture = new CompletableFuture<>();

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
		assertNotNull(stompClient);
	}

	@Test
	public void testWebSocketConnection() throws ExecutionException, InterruptedException, TimeoutException {
		StompSession session = stompClient
				.connect(wsUrl, new StompSessionHandlerAdapter() {
				})
				.get(5, TimeUnit.SECONDS);

		assertNotNull(session);
		assertTrue(session.isConnected());

		session.disconnect();
	}

	@Test
	public void testSendMessage() throws ExecutionException, InterruptedException, TimeoutException {
		StompSession session = stompClient
				.connect(wsUrl, new StompSessionHandlerAdapter() {
				})
				.get(5, TimeUnit.SECONDS);

		session.subscribe("/topic/public", new StompFrameHandler() {
			@Override
			public Type getPayloadType(StompHeaders headers) {
				return ChatMessageResponse.class;
			}

			@Override
			public void handleFrame(StompHeaders headers, Object payload) {
				completableFuture.complete((ChatMessageResponse) payload);
			}
		});

		// Send a ChatMessageRequest (the new request DTO)
		ChatMessageRequest request = new ChatMessageRequest();
		request.setType(MessageType.CHAT);
		request.setContent("Test message");
		request.setSender("TestUser");

		session.send("/app/chat.sendMessage", request);

		// Receive a ChatMessageResponse (the new response DTO)
		ChatMessageResponse received = completableFuture.get(5, TimeUnit.SECONDS);

		assertNotNull(received);
		assertEquals("Test message", received.getContent());
		assertEquals("TestUser", received.getSender());
		assertEquals(MessageType.CHAT, received.getType());
		assertTrue(received.getTimestamp() > 0);

		session.disconnect();
	}

	@Test
	public void testChatMessageResponse() {
		// Test ChatMessageResponse builder
		ChatMessageResponse response = ChatMessageResponse.builder()
				.type(MessageType.JOIN)
				.content("Hello")
				.sender("User1")
				.timestamp(System.currentTimeMillis())
				.build();

		assertEquals(MessageType.JOIN, response.getType());
		assertEquals("Hello", response.getContent());
		assertEquals("User1", response.getSender());
		assertTrue(response.getTimestamp() > 0);
	}

	@Test
	public void testMessageTypes() {
		// Test all message types are available
		assertNotNull(MessageType.CHAT);
		assertNotNull(MessageType.JOIN);
		assertNotNull(MessageType.LEAVE);
		assertNotNull(MessageType.TYPING);
		assertNotNull(MessageType.FILE);
		assertNotNull(MessageType.READ);
		assertNotNull(MessageType.DELIVERED);

		assertEquals(7, MessageType.values().length);
	}
}
