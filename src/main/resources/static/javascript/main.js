'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var userAvatar = document.querySelector('#user-avatar');
var sidebar = document.querySelector('#sidebar');
var userList = document.querySelector('#user-list');
var chatTitle = document.querySelector('#chat-title');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function connect(event) {
    username = document.querySelector('#name').value.trim();
    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        connectingElement.classList.remove('hidden');

        userAvatar.style.backgroundColor = getAvatarColor(username);
        userAvatar.textContent = username[0].toUpperCase();

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.subscribe('/topic/active-users', onActiveUsersReceived);
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({ sender: username, type: 'JOIN' }));
    stompClient.send("/app/chat.getActiveUsers", {}, {});
    connectingElement.classList.add('hidden');
}

function onError(error) {
    connectingElement.innerHTML = '<span>Could not connect to WebSocket server. Please refresh this page to try again!</span>';
    connectingElement.style.color = 'red';
    connectingElement.classList.remove('hidden');
    console.error('WebSocket Error:', error);
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient && stompClient.connected) {
        var chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT',
            timestamp: new Date().toISOString()
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function onActiveUsersReceived(payload) {
    console.log('Received active users payload:', payload.body); // Debug log
    try {
        var users = payload.body ? JSON.parse(payload.body) : [];
        userList.innerHTML = '';
        users.forEach(user => {
            if (user !== username) {
                const li = document.createElement('li');
                li.className = 'user-item';
                li.textContent = user;
                userList.appendChild(li);
            }
        });
    } catch (e) {
        console.error('Error parsing active users:', e);
    }
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    if (message.type !== 'LEAVE' && message.type !== 'JOIN') {
        handleMessage(message);
    } else if (message.type === 'JOIN' || message.type === 'LEAVE') {
        handleEventMessage(message);
    }
}

function handleMessage(message) {
    var messageElement = document.createElement('li');
    messageElement.classList.add('chat-bubble', message.sender === username ? 'user' : 'bot');
    var avatarElement = document.createElement('span');
    avatarElement.className = 'avatar';
    avatarElement.style.backgroundColor = getAvatarColor(message.sender);
    avatarElement.textContent = message.sender[0].toUpperCase();

    var usernameElement = document.createElement('span');
    usernameElement.className = 'font-semibold mr-2';
    usernameElement.textContent = message.sender;

    var contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex items-center';
    contentWrapper.appendChild(avatarElement);
    contentWrapper.appendChild(usernameElement);

    var textElement = document.createElement('p');
    textElement.textContent = message.content;

    var timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formatTimestamp(message.timestamp);

    messageElement.appendChild(contentWrapper);
    messageElement.appendChild(textElement);
    messageElement.appendChild(timestampElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function handleEventMessage(message) {
    var messageElement = document.createElement('li');
    messageElement.classList.add('chat-bubble', 'event');
    var textElement = document.createElement('p');
    textElement.textContent = message.content;
    messageElement.appendChild(textElement);
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
