#!/usr/bin/env bash

docker exec --user=0 spiti_api_1 sequelize --env test db:create --debug
