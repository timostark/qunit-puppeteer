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
                    qunitPage: "https://localhost:9557/test/integration/opaTests.qunit.html?module=BNZ-ALZ%20Delta%20-%20Write%20Mode%20%2F%20Create%20%2F%20Delete#/ShiftSchedule/PlantSet/0000000002/1040"
                }
            }
        },
    });

    grunt.loadTasks('tasks');
    grunt.registerTask('doTestChrome', ['qunit_puppeteer:test']);
}