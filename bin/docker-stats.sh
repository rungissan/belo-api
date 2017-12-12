#!/usr/bin/env bash

docker stats $(docker ps --format={{.Names}})
