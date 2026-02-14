package com.bookmarks.bookmark;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class BookmarkEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public BookmarkEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishBookmarkUpvotedEvent(String payload) {
        kafkaTemplate.send("bookmark.upvoted", payload);
    }
}
