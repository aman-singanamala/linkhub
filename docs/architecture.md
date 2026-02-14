# Architecture Summary

## High-Level
- React client (web / future app) communicates over HTTPS to the API Gateway (Spring Cloud Gateway).
- Gateway routes requests to services and centralizes auth checks.
- Services: Auth, User, Bookmark, Notification.
- Each service owns its database (no direct DB sharing).
- Redis is used for caching/trending.
- Kafka is used for async event communication.
- WebSocket is used for real-time notifications.

## Service Responsibilities
Auth Service:
- Register / Login
- JWT + Refresh Token
- Role management
- Token validation endpoint (used by Gateway)

User Service:
- User profile management
- Follow / Unfollow
- User statistics
- Fetch public profile data

Bookmark Service:
- CRUD bookmarks
- Topics & Tags
- Comments & Upvotes
- Click tracking
- Trending calculation (cached in Redis)

Notification Service:
- Listens to Kafka events
- Stores notifications
- Sends real-time updates via WebSocket

## Communication Flows
Login Flow:
- Client -> API Gateway -> Auth Service
- Auth returns JWT + refresh token
- Gateway validates token on subsequent requests

Follow User (Event-Driven):
- Client -> User Service
- User Service publishes `UserFollowedEvent` to Kafka
- Notification Service consumes event
- Notification stored + WebSocket push

Upvote Flow:
- Client -> Bookmark Service
- Bookmark Service publishes `BookmarkUpvotedEvent` to Kafka
- Notification Service consumes event

## Data Ownership Principle
Each service has:
- Its own database
- No direct DB sharing
- Communication via REST or Kafka

Benefits:
- Scalability
- Loose coupling
- Independent deployment

## Future Enhancements
- Resilience4j (circuit breaker)
- Rate limiting at Gateway
- Centralized logging (ELK)
- Monitoring (Prometheus + Grafana)
- Distributed tracing (Zipkin)
