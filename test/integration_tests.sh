FILE='integration_tests.json'

if test -f "$FILE"; then
    PATH=FILE
else
    PATH="test/$FILE"
fi

aws lambda invoke 
    --function-name 'tests:live'
    --payload "file://$PATH"
    --outfile 'integration_test_results.json'