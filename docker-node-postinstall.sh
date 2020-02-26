#!/usr/bin/env bash
cd /home/node/app
CONTAINER_ALREADY_STARTED="CONTAINER_ALREADY_STARTED_PLACEHOLDER"
if [ ! -e $CONTAINER_ALREADY_STARTED ]; then
    touch $CONTAINER_ALREADY_STARTED
    echo "-- First container startup --"
    npm i
    cp config/index.dist.js config/index.js
else
    echo "-- Not first container startup --"
fi

node /home/node/app/index.js console silly
