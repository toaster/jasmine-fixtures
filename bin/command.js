#!/usr/bin/env node

const helperSetup = require('code_cowboy-jasmine-helper_setup');

content =
`'use strict';

const Fixtures = require('code_cowboy-jasmine-fixtures');

let global = jasmine.getGlobal();
global.fixture = (name, fn) => {
  Fixtures.define(global, global.beforeAll, global.afterAll, name, fn);
};
global.subject = (name, fn) => {
  Fixtures.define(global, global.beforeAll, global.afterAll, name, fn, true);
};

jasmine.getEnv().addReporter({
  specStarted: () => Fixtures.prepare(global),
  specDone: () => Fixtures.cleanup(global),
});
`

helperSetup('code_cowboy-jasmine-fixtures', content);
