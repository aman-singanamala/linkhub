package com.bookmarks.user;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public UserEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserFollowedEvent(String payload) {
        kafkaTemplate.send("user.followed", payload);
    }
}
