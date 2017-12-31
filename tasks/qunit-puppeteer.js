#! /usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

module.exports = function (grunt) {

  grunt.registerMultiTask('qunit_puppeteer', 'Run QUnit-Tests with Headless Chrome', function () {
    var done = this.async();
    var oOptions = this.options({
      resources: {}
    });

    if (!oOptions.qunitPage) {
      grunt.fail.warn('qunitPage missing.');
      done();
      return;
    }

    oOptions.traceSettings = oOptions.traceSettings || {};
    oOptions.traceSettings.outputConsole = typeof oOptions.traceSettings.outputConsole !== "undefined" ? oOptions.traceSettings.outputConsole : false;
    oOptions.traceSettings.outputAllAssertions = typeof oOptions.traceSettings.outputAllAssertions !== "undefined" ? oOptions.traceSettings.outputAllAssertions : false;
    if (typeof oOptions.headless === "undefined") {
      oOptions.headless = true;
    }
    oOptions.viewport = oOptions.viewport || {};
    oOptions.viewport.width = oOptions.viewport.width || 1920;
    oOptions.viewport.height = oOptions.viewport.height || 1920;

    var oEmulate = null;
    if (oOptions.mobile && oOptions.mobile.emulate === true) {
      var sDevice = "";
      if (oOptions.mobile.tablet === true) {
        sDevice = "iPad Pro";
      } else if (oOptions.mobile.landscape === true && oOptions.mobile.tablet === false) {
        sDevice = "iPhone 6 Plus landscape";
      } else if (oOptions.mobile.landscape === false && oOptions.mobile.tablet === false) {
        sDevice = "iPhone 6 Plus";
      }

      if (!devices[sDevice]) {
        grunt.fail.warn('specified device emulated is not available.');
        done();
        return;
      }
      oEmulate = devices[sDevice];
    }

    const targetURL = oOptions.qunitPage;
    const timeout = parseInt(300000, 10);
    (async () => {
      grunt.log.ok("Async Processing of test started");
      const args = [
        "--disable-web-security",
        "--ignore-certificate-errors",
      ];
      //hack to resolve everything at the end
      var fnPromiseResolve, fnPromiseReject;
      var oTestSuitePromise = new Promise(function (resolve, reject) {
        fnPromiseResolve = resolve;
        fnPromiseReject = reject;
      });

      const browser = await puppeteer.launch({
        args,
        headless: oOptions.headless,
        ignoreHTTPSErrors: true,
        executablePath: oOptions.chromeExecutable
      });
      const page = await browser.newPage();
      page.setViewport({ width: oOptions.viewport.width, height: oOptions.viewport.height });
      if (oEmulate) {
        await page.emulate(oEmulate);
      }

      // Attach to browser console log events, and log to node console
      if (oOptions.traceSettings.outputConsole === true) {
        await page.on('console', (...params) => {
          for (let i = 0; i < params.length; ++i)
            console.log(`${params[i]}`);
        });
      }

      await page.exposeFunction('harness_moduleDone', context => {
        if (context.failed) {
          grunt.log.error("Module Failed: " + context.name + " ( " + context.failed + " / " + context.passed + " ) in " + context.runtime + "ms");
        } else {
          grunt.log.ok("Module Succeeded: " + context.name + " (" + context.passed + " Tests) in " + context.runtime + "ms");
        }
      });

      await page.exposeFunction('harness_testDone', context => {
        if (context.failed) {
          grunt.log.error("Test Failed: " + context.name + " ( " + context.failed + " / " + context.passed + " ) in " + context.runtime + "ms");
        } else {
          grunt.log.ok("Test Succeeded: " + context.name + " (" + context.passed + " Tests) in " + context.runtime + "ms");
        }
      });

      await page.exposeFunction('harness_moduleStart', context => {
        grunt.log.ok("Start Module:" + context.name);
      });

      await page.exposeFunction('harness_testStart', context => {
        grunt.log.ok("Start Test:" + context.name);
      });

      await page.exposeFunction('harness_log', context => {
        if (oOptions.traceSettings.outputAllAssertions === false && context.result) {
          return;
        }
        if (!context.result) {
          grunt.log.error("Assertion Failed: " + (context.message ? context.message : "unknown") + "; Values:" + context.expected + "/" + context.actual);
        } else {
          grunt.log.ok("Assertion Succeeded: " + (context.message ? context.message : "unknown") + "; Values:" + context.expected + "/" + context.actual);
        }
      });

      await page.exposeFunction('harness_done', context => {
        var stats = [
          "Time: " + context.runtime + "ms",
          "Total: " + context.total,
          "Passed: " + context.passed,
          "Failed: " + context.failed
        ];
        grunt.log.ok(stats.join(", "));

        //hacky coding - waiting for 500ms, will avoid unhandled open promises
        //we are in a completly different scope here (of the page from my understanding)
        //the promise might be resolved to early, in case we are not waiting..
        setTimeout(function () {
          if (context.failed > 0) {
            fnPromiseReject({
              context: context
            });
          }
          fnPromiseResolve();
        }, 500);
      });

      await page.goto(targetURL, { timeout: 50000, waitUntil: "load" });
      await page.evaluate(() => {
        QUnit.moduleStart((context) => { window.harness_moduleStart(context); });
        QUnit.moduleDone((context) => { window.harness_moduleDone(context); });
        QUnit.testStart((context) => { window.harness_testStart(context); });
        QUnit.testDone((context) => { window.harness_testDone(context); });
        QUnit.log((context) => { window.harness_log(context); });
        QUnit.done((context) => { window.harness_done(context); });
      });

      try {
        await oTestSuitePromise;
      } catch (e) {
        await browser.close(); //close always to avoid memory leaks
        grunt.fail.warn('OPA/QUnit identified errors (' + e.context.failed + ')');
      }

      await browser.close();
      done();
    })().catch((error) => {
      console.error(error);
      grunt.fail.warn('QUnit found exception (' + error.message + ')');
    });
  });
};

