# banner-proxy

An AWS Lambda function for retrieving and caching data from Ellucian Banner via the [BannerJS module](https://github.com/schedulemaker/bannerjs).

### Invoking
Invoke the Lambda using **banner-proxy:\<QUALIFIER>**, where `<QUALIFIER>` can be either a version number or alias (recommended to use the `live` alias as it has been tested and is stable).
#### All payloads should adhere to the following JSON format:

```
{
  school: <STRING>,
  term: <NUMBER>,
  method: <STRING>, #See BannerJS documentation for a list of methods
  params: {<PARAMS>} #Optional, arguments to pass to the BannerJS method being called. See the BannerJS documentation for more info
}
```

### Deploying
**Note:** the BannerJS module and [AWS CLI](https://aws.amazon.com/cli/) are needed for this section.

#### To deploy the Lambda to AWS:
1. Clone both this repository and the [BannerJS](https://github.com/schedulemaker/bannerjs) repository locally.
2. Run `/path/to/bannerjs/deploy.sh | /path/to/banner proxy/deploy.sh`

### Unit tests
This repo contains a [Mocha](https://mochajs.org/) test suite, utilizing a mocked Banner library. 

#### To run the unit tests:

1. Run `npm install` to install the [rewire](https://github.com/jhnns/rewire) mocking dependency.
  * If Mocha is not installed, run `npm install -g mocha`
2. Run `npm test` or `mocha` to run the test suite.

### Integration tests
**Note**: the [AWS CLI](https://aws.amazon.com/cli/) needs to be installed and configured for this section.

The repo also contains a series of integration tests meant to be run against the deployed Lambda on AWS (where it has access to the Banner module via a custom layer). These can be found in `test/integration_tests.json` and can be run with the [Unit Testing Lambda](https://github.com/schedulemaker/tests) via the `test/integration_tests.sh` shell script, which will log the results to `integration_test_results.json`.


#### Sample JSON for Lambda console test events:

```
{
  "school": "temple",
  "term": 202036,
  "method": "classSearch",
  "params": {
    "term": 202036,
    "subject": "MATH",
    "offset": 0,
    "pageSize": 25
  }
}
```
```
{
  "school": "temple",
  "term": 202036,
  "method": "getCampuses"
}
```
```
{
  "school": "temple",
  "term": 202036,
  "method": "getInstructors",
  "params": {
    "term": 202036
  }
}
```

This test event should throw an error:
```
{
  "school": "temple",
  "foo": "foo",
  "bar": "bar"
}
```

