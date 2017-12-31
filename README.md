# grunt-qunit-puppeteer
A test harness for running QUnit/OPA tests in headless Chromium via grunt

## Usage
```
npm install grunt-qunit-puppeteer
Add Grunt Task as described within the example in this repository + Run Grunt with grunt-qunit-puppeteer task (see example)
```

The output will look something like this:

```
Running "qunit_puppeteer:test" (qunit_puppeteer) task
>> Async Processing of test started
>> Start Module:[Module Name - Description]
>> Start Test:Should see the master list with all entries
>> Test Succeeded: Should see the master list with all entries (2 Tests) in 2450ms
...............
>> Start Test:Test Description
>> Assertion Failed: Assertion Description; Values:true/false
>> Test Failed: Test Description  ( 1 / 1 ) in 299ms
................
>> Module Failed: Module Name ( 1 / 56 ) in 11521ms
...............
>> Time: 11537ms, Total: 57, Passed: 56, Failed: 1
Warning: OPA/QUnit identified errors (1) Use --force to continue.

Aborted due to warnings.
```