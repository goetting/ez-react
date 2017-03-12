import ezReact from '../src/index.js';
import React from 'react';
import just from 'jest';
import { shallow, mount } from 'enzyme';
import EZFlux from 'ez-flux';
import {
  makeConnectedEZFlux,
  getTestState,
  testHandler,
  TestBunker,
  makeTestBunker,
  tryCatch,
} from './test-lib-data';

const tests = {
  ezReact: {
    addConnectors: {
      'should add connectors to an ezFlux instance if needed': addConnectors,
    },
    connect: {
      'should call connectClass if given component is Class or function': connectClass,
      'should call connectInstance if given component is instance of a React.Component': connectInstance,
    },
    validateArguments: {
      'should throw if given ezFlux is not typeof EZFlux': validArgsNoEZFlux,
      'should throw if given component is falsy or not typeof object or function': validArgsNoComponent,
      'should throw if given handlers are falsy or not a map of functions': validArgsNoHandlers,
      'should throw if given keys in handlers are not ezFLux state keys': validArgsNoValidState,
    },
    connectInstance: {
      'will bind state to component state': instanceBindState,
      'will start listening after mount and stop listening after umount': instanceStopStart,
    },
    connectClass: {
      'will bind state to props': classProps,
      'will start after mount and stop after unmount': classStartStop,
    },
  },
};

function addConnectors() {
  const state = getTestState();
  const ez = new EZFlux(state);

  expect(ez.state.blackMesa.contaminated).toEqual(false);
  expect(ez.connect).toEqual(undefined);

  ezReact.addConnector(ez);

  expect(typeof ez.connect).toEqual('function');

}
function connectClass() {
  const ez = makeConnectedEZFlux();
  const actualConnectClass = ezReact.connectClass;
  const mockFn = jest.fn();

  ezReact.connectClass = mockFn;
  const Comp = ez.connect(TestBunker, testHandler);

  ezReact.connectClass = actualConnectClass;
  expect(mockFn).toHaveBeenCalled();
}
function connectInstance() {
  const ez = makeConnectedEZFlux();
  const actualConnectInstance = ezReact.connectInstance;
  const mockFn = jest.fn();

  ezReact.connectInstance = mockFn;
  const Comp = ez.connect(<TestBunker name="Black Mesa" />, testHandler)

  ezReact.connectInstance = actualConnectInstance;
  expect(mockFn).toHaveBeenCalled();
}
function validArgsNoEZFlux() {
  const err = tryCatch(() => ezReact.connect(TestBunker, testHandler, { crap: true }));

  expect(err).toBeTruthy();
}
function validArgsNoComponent() {
  const ez = makeConnectedEZFlux();
  let err = tryCatch(() => ez.connect(null, testHandler));

  expect(err).toBeTruthy();

  err = tryCatch(() => ez.connect(undefined, testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ez.connect('check me out!', testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ez.connect(1337, testHandler));
  expect(err).toBeTruthy();
}
function validArgsNoHandlers() {
  const ez = makeConnectedEZFlux();
  const err = tryCatch(() => ez.connect(TestBunker, 'fuuuu'));

  expect(err).toBeTruthy();
}
function validArgsNoValidState() {
  const ez = makeConnectedEZFlux();
  let err = tryCatch(() => ez.connect(TestBunker, { crap: () => {} }));

  expect(err).toBeTruthy();
  err = tryCatch(() => ez.connect(TestBunker, { blackMesa: true }));
  expect(err).toBeTruthy();
}
function instanceBindState() {
  const ez = makeConnectedEZFlux();
  let connectedTestBunkerInst = null;
  const ConnectedTestBunker = makeTestBunker((inst) => {
    connectedTestBunkerInst = inst;
    ez.connect(inst, testHandler, ez)
  });
  const tree = mount(<ConnectedTestBunker name="Black Mesa" />);

  ez.actions.blackMesa.startExperiment();
  expect(connectedTestBunkerInst.state).toEqual(ez.state.blackMesa);
  tree.unmount();
}
function instanceStopStart() {
  const ez = makeConnectedEZFlux();
  let connectedTestBunkerInst = null;
  const ConnectedTestBunker = makeTestBunker((inst) => {
    connectedTestBunkerInst = inst;
    ez.connectInstance(inst, testHandler, ez);
  });

  expect(ez._events['state.change.blackMesa']).toBeFalsy();
  const tree = mount(<ConnectedTestBunker name="Black Mesa" />);
  expect(ez._events['state.change.blackMesa']).toBeTruthy();
  tree.unmount();
  expect(ez._events['state.change.blackMesa']).toBeFalsy();
}
function classProps() {
  const ez = makeConnectedEZFlux();
  const ConnectedBunker = ez.connect(TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  const testBunker = tree.find('TestBunker').node;
  const initialProps = { name: 'Black Mesa', children: undefined };
  expect(testBunker.props).toEqual(initialProps);

  ez.actions.blackMesa.contain();
  expect(testBunker.props).toEqual(Object.assign(initialProps, ez.state.blackMesa));
  tree.unmount();
}
function classStartStop() {
  const ez = makeConnectedEZFlux();
  const ConnectedBunker = ez.connectClass(TestBunker, testHandler);

  expect(ez._events['state.change.blackMesa']).toBeFalsy();
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  expect(ez._events['state.change.blackMesa']).toBeTruthy();
  tree.unmount();
  expect(ez._events['state.change.blackMesa']).toBeFalsy();
}


function run(json) {
  for (let k in json) json[k].call ? it(k, json[k]) : describe(k, () => run(json[k]));
}
run(tests);

