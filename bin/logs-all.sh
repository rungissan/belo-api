#!/usr/bin/env bash

cd ..
docker-compose -p spiti logs -f --tail=1
