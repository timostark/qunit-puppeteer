module.exports = function (grunt) {
    'use strict';

    // create config
    grunt.initConfig({
        qunit_puppeteer: {
            test: {
                options: {
                    headless: false,
                    viewport: {
                        width: 1920,
                        height: 1080
                    },
                    mobile: {
                        emulate: false,
                        landscape: true,
                        tablet: false
                    },
                    chromeExecutable: "C:/Projects/Daimler pBK/REA/PBKKMSLocationHierarchy/node_modules/puppeteer/.local-chromium/win64-494755/chrome-win32/chrome.exe",
                    qunitPage: "https://localhost:9557/test/integration/opaTests.qunit.html?module=BNZ-ALZ%20Model%20Assignment%20-%20Write%20Mode%20%2F%20Create%20%2F%20Delete#//BNZALZ"
                }
            }
        },
    });

    grunt.loadTasks('tasks');
    grunt.registerTask('doTestChrome', ['qunit_puppeteer:test']);
}