#!/usr/bin/env bash

docker exec --user=0 spiti_api_1 sequelize --env db db:migrate --debug
