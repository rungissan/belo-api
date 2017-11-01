#!/usr/bin/env bash

docker-compose -p pg -f docker-compose.yml up -d

sleep 2
google-chrome --app="http://localhost:5050"
