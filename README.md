# banner-proxy

#### All payloads passed should have the following format:

```
{
  school: <SCHOOL_NAME>,
  term: <TERM_CODE>,
  method: <METHOD_NAME>, #See BannerJS documentation for list of methods
  params: {<PARAMS>} #params to pass to the BannerJS method. See the BannerJS documentation for more info
}
```

Sample JSON for Lambda console test events:

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
