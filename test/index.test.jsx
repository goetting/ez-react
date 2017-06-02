/* eslint-disable no-use-before-define */
import React from 'react';
import { mount } from 'enzyme';
import createConnector, { normaliseHandler } from '../src/index';
import { testHandler, TestBunker, makeStore } from './test-lib-data';

describe('ezReact', () => {
  describe('createConnector', () => {
    it('should return a function', createCon);
  });
  describe('connect', () => {
    it('should throw if given component is not a function', connectNoComponent);
    it('should throw if given handlers not a map of functions', connectNoHandlers);
    it('should not blow up if propper params are given', connectWorks);
    it('should throw if given handler keys are not stores', connectNoStores);
    it('should bind state to props', connectBindStateToProps);
    it('should initialize a component with initProps when given', connectInitProps);
    it('should start after mount and stop after unmount', connectTiming);
  });
  describe('normaliseHandler', () => {
    it('should fail if the arg is neither array nor function', normaliseFail);
    it('should return the arg if its a function', normaliseFunction);
    it('should return a mapping function if given an array of keys', normaliseArray);
  });
});

function createCon() {
  expect(typeof createConnector()).toBe('function');
}

function connectNoComponent() {
  const connect = createConnector({});
  let threw = false;

  try {
    connect(null);
  } catch (e) {
    threw = true;
  }
  expect(threw).toBe(true);
}

function connectNoHandlers() {
  const connect = createConnector({});
  let threw = false;

  try {
    connect(() => {}, null);
  } catch (e) {
    threw = true;
  }
  expect(threw).toBe(true);
}

function connectNoStores() {
  const connect = createConnector({});
  let threw = false;

  try {
    connect(() => {}, { foo: () => {} });
  } catch (e) {
    threw = true;
  }
  expect(threw).toBe(true);
}


function connectWorks() {
  const blackMesa = makeStore();
  const connect = createConnector({ blackMesa });
  const ConnectedBunker = connect(TestBunker, testHandler);
  let threw = false;
  try {
    mount(<ConnectedBunker name="Black Mesa" />).unmount();
  } catch (e) {
    threw = true;
  }
  expect(threw).toBe(false);
}

function connectBindStateToProps() {
  const blackMesa = makeStore();
  const connect = createConnector({ blackMesa });
  const ConnectedBunker = connect(TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  const testBunker = tree.find('TestBunker').node;
  const initialProps = { name: 'Black Mesa', children: undefined };

  expect(testBunker.props).toEqual(initialProps);

  blackMesa.startExperiment();
  blackMesa.contain();
  expect(testBunker.props).toEqual(Object.assign(initialProps, blackMesa.$copy()));
  tree.unmount();
}

function connectInitProps() {
  const initProps = { name: 'Red Mesa', foo: 'bar', children: undefined };
  const blackMesa = makeStore();
  const connect = createConnector({ blackMesa });
  const ConnectedBunker = connect(TestBunker, testHandler, initProps);
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  const testBunker = tree.find('TestBunker').node;

  expect(testBunker.props).toEqual(initProps);

  tree.unmount();
}

function connectTiming() {
  const blackMesa = makeStore();
  const connect = createConnector({ blackMesa });
  const ConnectedBunker = connect(TestBunker, testHandler);

  expect(blackMesa.$events.change && blackMesa.$events.change.length).toBeFalsy();
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  expect(blackMesa.$events.change && blackMesa.$events.change.length).toBeTruthy();
  tree.unmount();
  expect(blackMesa.$events.change && blackMesa.$events.change.length).toBeFalsy();
}

function normaliseFail() {
  let errCount = 0;

  try {
    normaliseHandler({});
  } catch (e) {
    errCount++;
  }
  try {
    normaliseHandler(null);
  } catch (e) {
    errCount++;
  }
  try {
    normaliseHandler(0);
  } catch (e) {
    errCount++;
  }
  try {
    normaliseHandler(1);
  } catch (e) {
    errCount++;
  }
  try {
    normaliseHandler('string');
  } catch (e) {
    errCount++;
  }
  try {
    normaliseHandler('');
  } catch (e) {
    errCount++;
  }
  expect(errCount).toBe(6);
}

function normaliseFunction() {
  expect(typeof normaliseHandler(() => {})).toBe('function');
}

function normaliseArray() {
  const handler = normaliseHandler(['foo', 'bar']);
  const testState = { foo: 'test', bar: 'test' };

  expect(typeof handler).toBe('function');

  const newState = handler(testState);

  expect(newState).not.toBe(testState);
  expect(newState).toMatchObject(testState);
}
