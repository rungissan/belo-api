#!/usr/bin/env bash

# restore backup from directory format 

set -x

BACKUP_NAME=backup_testing
docker cp ~/Downloads/backup_testing/. spiti_postgres_1:$BACKUP_NAME

docker exec spiti_postgres_1 psql -c 'DROP SCHEMA IF EXISTS auth CASCADE;' -d spiti -U admin
docker exec spiti_postgres_1 psql -c 'DROP SCHEMA IF EXISTS spiti CASCADE;' -d spiti -U admin
docker exec spiti_postgres_1 psql -c 'DROP SCHEMA IF EXISTS public CASCADE;' -d spiti -U admin
docker exec spiti_postgres_1 psql -c 'CREATE SCHEMA IF NOT EXISTS public' -d spiti -U admin

docker exec spiti_postgres_1 pg_restore -U admin -C -d template1  $BACKUP_NAME
