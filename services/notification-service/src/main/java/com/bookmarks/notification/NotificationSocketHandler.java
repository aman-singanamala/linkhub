package com.bookmarks.notification;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class NotificationSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Echo placeholder; replace with real push logic
        session.sendMessage(new TextMessage("ack:" + message.getPayload()));
    }
}
