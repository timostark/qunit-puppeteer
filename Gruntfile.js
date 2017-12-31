module.exports = function (grunt) {
    'use strict';

    // create config
    grunt.initConfig({
        qunit_puppeteer: {
            test: {
                options: {
                    headless: true,
                    traceSettings: {
                        outputConsole: false,
                        outputAllAssertions: false,
                    },
                    viewport: {
                        width: 1920,
                        height: 1080
                    },
                    mobile: {
                        emulate: false,
                        landscape: true,
                        tablet: false
                    },
                    qunitPage: "https://localhost:9557/test/integration/opaTests.qunit.html?module=Factors%20-%20Write%20Mode%20%2F%20Create%20%2F%20Delete%20%26%20Maintain%20Factors"
                }
            }
        },
    });

    grunt.loadTasks('tasks');
    grunt.registerTask('doTestChrome', ['qunit_puppeteer:test']);
}