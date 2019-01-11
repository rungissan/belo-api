#!/usr/bin/env bash

cd ..
export UID
export GID
docker-compose -p belo -f docker-compose.yml -f docker-compose.dev.yml up $@
