#!/bin/bash

FILE='integration_tests.json'

if test -f "$FILE"; then
    FILE=FILE
else
    FILE="test/$FILE"
fi

aws lambda invoke \
    --function-name 'tests:live' \
    --payload "file://$FILE" \
    'integration_test_results.json' \