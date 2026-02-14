package com.bookmarks.notification;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventConsumer {

    @KafkaListener(topics = {"user.followed", "bookmark.upvoted"}, groupId = "notification-service")
    public void handleEvent(String payload) {
        // TODO: parse payload, persist notification, and push via WebSocket
    }
}
