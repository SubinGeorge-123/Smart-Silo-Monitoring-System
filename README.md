# Smart Grain Silo Monitoring System

This project is a real-time monitoring system for grain silos built using a fog-cloud IoT architecture. It monitors five environmental parameters using simulated sensors and sends alerts when values exceed safe thresholds.

## Architecture

-Sensor Layer: Node.js Simulator MQTT / AWS IoT Core
-Fog Layer: AWS Lambda Filtering & Thresholds
-Messaging Layer: Amazon SQS FIFO Ordering & Deduplication
-Backend Layer: Lambda + DynamoDB Storage & Processing
-Presentation Layer: React Dashboard WebSocket API


## CI/CD Pipeline

-Push to GitHub Repository — push updated code to the GitHub repository, triggering the automated pipeline.
-GitHub Actions Triggered — The workflow is automatically activated on every push
-Install Dependencies — Pipeline installs all required Node.js packages and libraries needed to build the React application.
-Build React Application — The React app is compiled into optimised static files (HTML, CSS, JavaScript) ready for production.
-Upload Static Files to S3 — The generated build files are uploaded to an Amazon S3 bucket configured for static website hosting.
-Deploy as Static Website — S3 serves the files as a publicly accessible static website


## Key Design Patterns

-Serverless Computing — AWS Lambda auto-scales with workload fluctuations; pay-per-use keeps costs low.
-Event-Driven Architecture — Components communicate via events (MQTT messages, SQS triggers), keeping the system loosely coupled  and flexible.
-Publish-Subscribe Messaging — Reducing communication overhead and enabling scalable data distribution.
-Queue-Based Load Levelling — Amazon SQS absorbs data spikes, preventing overload and ensuring fault-tolerant, steady processing.
-Real-Time Push via WebSockets — Bidirectional client-server communication delivers live updates to the dashboard with minimal network overhead.
-DynamoDB for Scalable Storage — NoSQL database with automatic scaling, high throughput, and low-latency reads; no schema management required, ideal for variable IoT data.




