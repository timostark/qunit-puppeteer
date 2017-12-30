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
    
    /*if (!oOptions.chromeExecutable) {
      grunt.fail.warn('chromeUrl missing.');
      done();
      return;
    }*/
    if (!oOptions.qunitPage) {
      grunt.fail.warn('qunitPage missing.');
      done();
      return;
    }
    
    if (typeof oOptions.headless === "undefined") {
      oOptions.headless = true;
    }
    oOptions.viewport       = oOptions.viewport || { };
    oOptions.viewport.width = oOptions.viewport.width || 1920;
    oOptions.viewport.height = oOptions.viewport.height || 1920;

    var oEmulate = null;
    if ( oOptions.mobile && oOptions.mobile.emulate === true ) {
      var sDevice = "";
      if ( oOptions.mobile.tablet === true ) {
        sDevice = "iPad Pro";
      } else if ( oOptions.mobile.landscape === true && oOptions.mobile.tablet === false ) {
        sDevice = "iPhone 6 Plus landscape";
      } else if ( oOptions.mobile.landscape === false && oOptions.mobile.tablet === false ) {
        sDevice = "iPhone 6 Plus";
      }

      if ( !devices[ sDevice ] ) {
        grunt.fail.warn('specified device emulated is not available.');
        done();
        return;
      }
      oEmulate = devices[ sDevice ];
    }

    grunt.log.writeln('Processing task...');

    const targetURL = oOptions.qunitPage;
    const timeout = parseInt(300000, 10);
    (async () => {
      grunt.log.writeln('Started...');
      const browser = await puppeteer.launch({
        headless: oOptions.headless,
        ignoreHTTPSErrors: true,
        executablePath: oOptions.chromeExecutable
      });
      const page = await browser.newPage();
      page.setViewport({ width: oOptions.viewport.width, height: oOptions.viewport.height });
      if ( oEmulate ) {
        await page.emulate(oEmulate);        
      }

      // Attach to browser console log events, and log to node console
      await page.on('console', (...params) => {
        for (let i = 0; i < params.length; ++i)
          console.log(`${params[i]}`);
      });

      var moduleErrors = [];
      var testErrors = [];
      var assertionErrors = [];

      await page.exposeFunction('harness_moduleDone', context => {
        if (context.failed) {
          var msg = "Module Failed: " + context.name + "\n" + testErrors.join("\n");
          moduleErrors.push(msg);
          testErrors = [];
        }
      });

      await page.exposeFunction('harness_testDone', context => {
        if (context.failed) {
          var msg = "  Test Failed: " + context.name + assertionErrors.join("    ");
          testErrors.push(msg);
          assertionErrors = [];
          process.stdout.write("F");
        } else {
          process.stdout.write(".");
        }
      });

      await page.exposeFunction('harness_log', context => {
        if (context.result) { return; } // If success don't log

        var msg = "\n    Assertion Failed:";
        if (context.message) {
          msg += " " + context.message;
        }

        if (context.expected) {
          msg += "\n      Expected: " + context.expected + ", Actual: " + context.actual;
        }

        assertionErrors.push(msg);
      });

      await page.exposeFunction('harness_done', context => {
        console.log("\n");

        if (moduleErrors.length > 0) {
          for (var idx = 0; idx < moduleErrors.length; idx++) {
            console.error(moduleErrors[idx] + "\n");
          }
        }

        var stats = [
          "Time: " + context.runtime + "ms",
          "Total: " + context.total,
          "Passed: " + context.passed,
          "Failed: " + context.failed
        ];
        console.log(stats.join(", "));

        browser.close();
        if (context.failed > 0) {
          process.exit(1);
        } else {
          done();
        }
      });

      await page.goto(targetURL);
      await page.evaluate(() => {
        // Cannot pass the window.harness_blah methods directly, because they are
        // automatically defined as async methods, which QUnit does not support
        QUnit.moduleDone((context) => { window.harness_moduleDone(context); });
        QUnit.testDone((context) => { window.harness_testDone(context); });
        QUnit.log((context) => { window.harness_log(context); });
        QUnit.done((context) => { window.harness_done(context); });

        console.log("\nRunning: " + JSON.stringify(QUnit.urlParams) + "\n");
      });
    })();
  });
};

