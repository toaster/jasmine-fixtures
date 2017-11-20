'use strict';

describe("fixtures", () => {
  const Fixtures = require('..');
  var context = {};
  var variable;
  var valueAccessedInBefore;

  Fixtures.define(context, beforeAll, afterAll, "functionFixture",
      () => { return `variable: ${variable}`; });
  Fixtures.define(context, beforeAll, afterAll, "staticFixture", "static value");
  Fixtures.define(context, beforeAll, afterAll, "accessedInBefore",
      () => { return `variable: ${variable}`; });
  Fixtures.define(context, beforeAll, afterAll, "willBeOverridden", "outer value");
  Fixtures.define(context, beforeAll, afterAll, "willBeAccessedOnPrepare!",
      () => { return `variable: ${variable}`; });
  Fixtures.define(context, beforeAll, afterAll, "willBeOverriddenWithExclamationMark",
      () => { return `variable: ${variable}`; });

  beforeEach(() => {
    Fixtures.cleanup(context);
    variable = 'initial';
    valueAccessedInBefore = context.accessedInBefore();
  });

  it("gives access to static values", () => {
    expect(context.staticFixture()).toEqual("static value");
  });

  it("returns the result of a function", () => {
    variable = "current value";
    expect(context.functionFixture()).toEqual("variable: current value");
  });

  it("memoizes the value", () => {
    variable = "first value";
    expect(context.functionFixture()).toEqual("variable: first value");
    variable = "second value";
    expect(context.functionFixture()).toEqual("variable: first value");
  });

  it("is accessible in beforeEach", () => {
    expect(valueAccessedInBefore).toEqual("variable: initial");
    variable = "changed";
    expect(context.accessedInBefore()).toEqual("variable: initial");
  });

  it("allows explicit definition by running prepare (e.g. via a reporter)", () => {
    variable = "before prepare";
    Fixtures.prepare(context);
    variable = "after prepare";
    expect(context.willBeAccessedOnPrepare()).toEqual("variable: before prepare");
  });

  it("cannot overwrite existing property", () => {
    let myContext = {foo: "bar"};
    expect(() => { Fixtures.define(myContext, beforeAll, afterAll, 'foo', 'bar'); })
        .toThrow("Cannot override already defined property with fixture: foo");
    expect(() => { Fixtures.define(myContext, beforeAll, afterAll, 'foo!', 'bar'); })
        .toThrow("Cannot override already defined property with fixture: foo");
  });

  it("can have its memoized value be cleaned up", () => {
    variable = "first value";
    expect(context.functionFixture()).toEqual("variable: first value");
    variable = "second value";
    Fixtures.cleanup(context);
    expect(context.functionFixture()).toEqual("variable: second value");
  });

  // Errors in reporter hooks don't let Jasmine fail, therefore we log the errors.
  it("logs errors during preparation", () => {
    let myContext = {};
    Fixtures.define(myContext, fn => fn(), fn => {}, 'fail!', () => { throw "oops"; });
    spyOn(console, 'error');
    Fixtures.prepare(myContext);
    expect(console.error).toHaveBeenCalledWith("fixture('fail!') failed:", 'oops');
  });

  it("cleans up on prepare (just to be sure)", () => {
    variable = "first value";
    expect(context.functionFixture()).toEqual("variable: first value");
    variable = "second value";
    Fixtures.prepare(context);
    expect(context.functionFixture()).toEqual("variable: second value");
  });

  describe("in a nested describe", () => {
    Fixtures.define(context, beforeAll, afterAll, "definedInNestedDescribe", "some value");
    Fixtures.define(context, beforeAll, afterAll, "willBeOverridden", "inner value");
    Fixtures.define(context, beforeAll, afterAll, "willBeOverriddenWithExclamationMark!",
        () => { return `!: ${variable}`; });
    Fixtures.define(context, beforeAll, afterAll, "subjectFixture",
        () => { return `variable: ${variable}`; }, true);

    Fixtures.prepare(context);

    it("works", () => { expect(context.definedInNestedDescribe()).toEqual("some value"); });

    it("can override already defined fixtures", () => {
      expect(context.willBeOverridden()).toEqual("inner value");
    });

    it("can override with exclamation mark", () => {
      variable = "before prepare";
      Fixtures.prepare(context);
      variable = "after prepare";
      expect(context.willBeOverriddenWithExclamationMark()).toEqual("!: before prepare");
    });

    it("can be made accessible as “subject”", () => {
      variable = "subject";
      expect(context.subject()).toEqual("variable: subject");
      variable = "later on";
      expect(context.subject()).toEqual("variable: subject");
      expect(context.subjectFixture()).toEqual("variable: subject");
    });

    it("can be accessed via its normal name if being a subject", () => {
      variable = "subject";
      expect(context.subjectFixture()).toEqual("variable: subject");
      variable = "later on";
      expect(context.subject()).toEqual("variable: subject");
      expect(context.subjectFixture()).toEqual("variable: subject");
    });

    describe("in an even deeper describe", () => {
      Fixtures.define(context, beforeAll, afterAll, "anotherSubject", "foo", true);

      it("can define another subject", () => {
        expect(context.subjectFixture()).toEqual("variable: initial");
        expect(context.subject()).toEqual("foo");
      });
    });

    it("preserves the subject when changed in a nested describe", () => {
      expect(context.subject()).toEqual("variable: initial");
    });
  });

  it("cannot access fixtures from a nested describe", () => {
    expect(context.definedInNestedDescribe).not.toBeDefined();
    expect(context.hasOwnProperty('definedInNestedDescribe')).toBe(false);
  });

  it("preserves values overridden in nested describe", () => {
    expect(context.willBeOverridden()).toEqual("outer value");
  });

  it("preserves preparation behaviour when overridden with exclamation mark in nested describe",
      () => {
    variable = "before prepare";
    Fixtures.prepare(context);
    variable = "after prepare";
    expect(context.willBeOverriddenWithExclamationMark()).toEqual("variable: after prepare");
  });

  it("cannot access subject from a nested describe", () => {
    expect(context.subject).not.toBeDefined();
    expect(context.hasOwnProperty('subject')).toBe(false);
  });
});
