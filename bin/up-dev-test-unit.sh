#!/usr/bin/env bash

cd ..
export UID
export GID
export TESTS_TYPE=":unit"
docker-compose -p spiti -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.dev.tests.yml up $@
