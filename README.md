# Photobooth-backend
[![CodeFactor](https://www.codefactor.io/repository/github/mime-a-mjupps/photobooth-backend/badge)](https://www.codefactor.io/repository/github/mime-a-mjupps/photobooth-backend)

The backend for the photobooth service used at Studentpuben Villan.

# Requirements
Docker
Docker-Compose
Traefik (if you want to be fancy and reverse proxy it)
# Installation

1. Build the docker base image.
```bash
docker build -t photoserver .
```
2. Copy the .env example to a .env and fill out the information.
```bash
cp .env.example .env
```
3. Deploy with docker-compose.
```bash
docker-compose up -d
```
