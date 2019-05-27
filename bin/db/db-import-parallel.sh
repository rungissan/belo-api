#!/usr/bin/env bash

# restore backup from directory format 

set -x

BACKUP_NAME=backup_testing
# docker cp ~/Downloads/backup_testing/. belo_postgres_1:$BACKUP_NAME

docker exec belo_postgres_1 psql -c 'DROP SCHEMA IF EXISTS auth CASCADE;' -d belo -U admin
docker exec belo_postgres_1 psql -c 'DROP SCHEMA IF EXISTS belo CASCADE;' -d belo -U admin
docker exec belo_postgres_1 psql -c 'DROP SCHEMA IF EXISTS public CASCADE;' -d belo -U admin
docker exec belo_postgres_1 psql -c 'CREATE SCHEMA IF NOT EXISTS public' -d belo -U admin

docker exec belo_postgres_1 pg_restore -U admin -C -d template1  $BACKUP_NAME
