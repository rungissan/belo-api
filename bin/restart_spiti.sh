#!/usr/bin/env bash

cd  ..

git pull samoshkin testing
export UID
export GID

docker-compose -p spiti -f docker-compose.yml -f docker-compose.testing.yml up $@

