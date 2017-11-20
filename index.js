'use strict';

function fixtureInitializeOnPrepareNames(container) {
  if (!container.__fixtures_initializeOnPrepare) {
    container.__fixtures_initializeOnPrepare = [];
  };
  return container.__fixtures_initializeOnPrepare;
}

function fixtureValues(container) {
  if (!container.__fixtures_values) {
    container.__fixtures_values = {};
  };
  return container.__fixtures_values;
}

const Fixtures = {
  define: (container, setup, teardown, name, fn, isSubject = false) => {
    let onPrepare = name.endsWith('!');
    if (onPrepare) {
      name = name.slice(0, -1);
    }

    if (container.hasOwnProperty(name)) {
      throw `Cannot override already defined property with fixture: ${name}`;
    }

    if (typeof fn !== 'function') {
      let value = fn;
      fn = () => value;
    }

    let previous, previousSubject;

    setup(() => {
      let initializeOnPrepare = fixtureInitializeOnPrepareNames(container);
      if (onPrepare) {
        initializeOnPrepare.push(name);
      }
      previous = container[name];
      previousSubject = container.subject;
      container[name] = () => {
        let values = fixtureValues(container);
        if (!values.hasOwnProperty(name)) {
          values[name] = fn();
        }
        return values[name];
      };
      if (isSubject) {
        container.subject = container[name];
      }
    });

    teardown(() => {
      let initializeOnPrepare = fixtureInitializeOnPrepareNames(container);
      if (previous) {
        container[name] = previous;
      } else {
        delete container[name];
      }
      if (isSubject) {
        if (previousSubject) {
          container.subject = previousSubject;
        } else {
          delete container.subject;
        }
      }
      if (onPrepare) {
        initializeOnPrepare.pop();
      }
    });
  },
  cleanup: (container) => {
    container.__fixtures_values = {};
  },
  prepare: (container) => {
    Fixtures.cleanup(container);
    let initializeOnPrepare = fixtureInitializeOnPrepareNames(container);
    try {
      for (var name of initializeOnPrepare) {
        container[name]();
      }
    } catch(e) {
      console.error(`fixture('${name}!') failed:`, e);
    }
  },
};

module.exports = Fixtures;
