#!/usr/bin/env bash

# create backup in directory format using 4 jobs
# docker exec spiti_postgres_1 pg_dump -U admin -Fd spiti -j 4 -f spt_testing_$(date +%Y%m%d)_backup
#
# copy backup folder outside container
# docker cp spiti_postgres_1:/tmp/spt_testing_20170827_backup .
#
# remove backup from container
# docker exec spiti_postgres_1 bash -c "rm -rf /tmp/spt_testing_20170827_backup"

set -x

BACKUP_NAME=/tmp/${1:-spt_testing}_$(date +%Y%m%d)_backup

docker exec spiti_postgres_1 pg_dump -U admin -Fd spiti -j 4 -f $BACKUP_NAME

cd ~/database-dumps/
docker cp spiti_postgres_1:$BACKUP_NAME .

docker exec spiti_postgres_1 bash -c "rm -rf $BACKUP_NAME"
