#!/usr/bin/env bash

cd ..
export UID
export GID
docker-compose -p spiti -f docker-compose.mac-dev.yml  up $@

