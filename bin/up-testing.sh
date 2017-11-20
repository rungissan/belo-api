#!/usr/bin/env bash

cd ..
export UID
export GID
docker-compose -p spiti -f docker-compose.yml -f docker-compose.testing.yml up $@
