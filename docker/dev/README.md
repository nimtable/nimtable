# Development Docker

This directory contains a Dockerfile and docker-compose.yml file for development purposes.

The image copies a pre-built jar from the host directly.
This way, you don't need to build the jar in the container.

## Usage

```bash
cd docker/dev
./build.sh
docker compose up --build
```
