#!/bin/bash

cd index && zip ../function.zip * && cd ../

ARN=$(aws iam create-role \
    --role-name BannerProxyRole \
    --assume-role-policy-document file://Trust-Role-Policy.json \
    | python3 -c "import json, sys; print(json.load(sys.stdin)['Role']['Arn'])")

aws iam attach-role-policy \
    --role-name BannerProxyRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws lambda create-function \
    --function-name banner-proxy \
    --runtime nodejs12.x \
    --role $ARN \
    --handler index.handler \
    --timeout 5 \
    --zip-file fileb://function.zip \
    --environment Variables="{EXPIRE=600,RAM_THRESHOLD=0.9,CHECK_FREQUENCY=10,EXCLUDED_METHODS=classSearch}" \
    --layers $(cat)

rm function.zip