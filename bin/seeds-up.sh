#!/usr/bin/env bash

docker exec spiti_api_1 sequelize --env db db:seed:all --debug
