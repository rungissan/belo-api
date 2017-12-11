#!/usr/bin/env bash

docker exec --user postgres spiti_postgres_1 bash -c "createdb spiti_test_db; pg_dump spiti -s | psql spiti_test_db"
