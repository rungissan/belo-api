#!/usr/bin/env bash

cd ..
docker-compose -p spiti -f docker-compose.yml -f docker-compose.testing.yml up $@
