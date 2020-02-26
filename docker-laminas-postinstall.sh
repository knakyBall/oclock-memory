#!/usr/bin/env bash
CONTAINER_ALREADY_STARTED="CONTAINER_ALREADY_STARTED_PLACEHOLDER"
if [ ! -e $CONTAINER_ALREADY_STARTED ]; then
    touch $CONTAINER_ALREADY_STARTED
    echo "-- First container startup --"
    cd /var/www
    chmod 777 data/cache -R
    composer install
    bower install --allow-root
else
    echo "-- Not first container startup --"
fi

/usr/local/bin/php -a
/bin/bash /usr/local/bin/docker-php-entrypoint --flags
