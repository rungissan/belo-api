#!/usr/bin/env bash

not_confirm() {
  read -r -p "${1:-You will remove all docker containers and images. Are you sure? [y/N]} " response
  case "$response" in
    [yY][eE][sS]|[yY])
      false
      ;;
    *)
      true
      ;;
  esac
}

not_confirm && exit 0

./down.sh

# Delete all containers
docker rm -f $(docker ps -a -q)

# Delete all images
docker rmi -f $(docker images -a -q)

# Delete all network
docker network rm $(docker network ls -q)

# Delete all volumes
docker run -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker:/var/lib/docker --rm martin/docker-cleanup-volumes
docker volume prune

# ./rm-dist.sh
