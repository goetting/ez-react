import ezReact from '../src/index.js';
import React from 'react';
import just from 'jest';
import { shallow, mount } from 'enzyme';
import EZFlux from 'ez-flux';
import {
  makeEz,
  getTestState,
  testHandler,
  TestBunker,
  makeTestBunker,
  tryCatch,
} from './test-lib-data';

describe('ezReact', () => {
  describe('connect', () => {
    it('should call connectClass if given component is Class or function', connectClass);
    it('should call connectInstance if given component is instance of a React.Component', connectInstance);
  });
  describe('validateArguments', () => {
    it('should throw if given ezFlux is not typeof EZFlux', validArgsNoEZFlux);
    it('should throw if given component is falsy or not typeof object or function', validArgsNoComponent)
    it('should throw if given handlers are falsy or not a map of functions', validArgsNoHandlers)
    it('should throw if given keys in handlers are not ezFLux state keys', validArgsNoValidState)
  });
  describe('connectInstance', () => {
    it('will bind state to component state', instanceBindState)
    it('will start listening after mount and stop listening after umount', instanceStopStart)
  });
  describe('connectClass', () => {
    it('will bind state to props', classProps)
    it('will start after mount and stop after unmount', classStartStop)
  });
})

const blackMesaChange = EZFlux.getChangeEventName('blackMesa');

function connectClass() {
  const ez =  makeEz();
  const actualConnectClass = ezReact.connectClass;
  const mockFn = jest.fn();

  ezReact.connectClass = mockFn;
  const Comp = ezReact.connect(ez, TestBunker, testHandler);

  ezReact.connectClass = actualConnectClass;
  expect(mockFn).toHaveBeenCalled();
}
function connectInstance() {
  const ez =  makeEz();
  const actualConnectInstance = ezReact.connectInstance;
  const mockFn = jest.fn();

  ezReact.connectInstance = mockFn;
  const Comp = ezReact.connect(ez, <TestBunker name="Black Mesa" />, testHandler)

  ezReact.connectInstance = actualConnectInstance;
  expect(mockFn).toHaveBeenCalled();
}
function validArgsNoEZFlux() {
  const err = tryCatch(() => ezReact.connect({ crap: true}, TestBunker, testHandler));

  expect(err).toBeTruthy();
}
function validArgsNoComponent() {
  const ez =  makeEz();
  let err = tryCatch(() => ezReact.connect(ez, null, testHandler));

  expect(err).toBeTruthy();

  err = tryCatch(() => ezReact.connect(ez, undefined, testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ezReact.connect(ez, 'check me out!', testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ezReact.connect(ez, 1337, testHandler));
  expect(err).toBeTruthy();
}
function validArgsNoHandlers() {
  const ez =  makeEz();
  const err = tryCatch(() => ezReact.connect(ez, TestBunker, 'fuuuu'));

  expect(err).toBeTruthy();
}
function validArgsNoValidState() {
  const ez =  makeEz();
  let err = tryCatch(() => ezReact.connect(ez, TestBunker, { crap: () => {} }));

  expect(err).toBeTruthy();
  err = tryCatch(() => ezReact.connect(ez, TestBunker, { blackMesa: true }));
  expect(err).toBeTruthy();
}
async function instanceBindState() {
  const ez =  makeEz();
  let connectedTestBunkerInst = null;
  const ConnectedTestBunker = makeTestBunker((inst) => {
    connectedTestBunkerInst = inst;
    ezReact.connect(ez, inst, testHandler);
  });
  const tree = mount(<ConnectedTestBunker name="Black Mesa" />);

  await ez.actions.blackMesa.startExperiment();

  expect(connectedTestBunkerInst.state).toEqual(ez.state.blackMesa);
  tree.unmount();
}
function instanceStopStart() {
  const ez = makeEz();
  let connectedTestBunkerInst = null;
  const ConnectedTestBunker = makeTestBunker((inst) => {
    connectedTestBunkerInst = inst;
    ezReact.connectInstance(ez, inst, testHandler);
  });

  expect(ez._events[blackMesaChange]).toBeFalsy();
  const tree = mount(<ConnectedTestBunker name="Black Mesa" />);
  expect(ez._events[blackMesaChange]).toBeTruthy();
  tree.unmount();
  expect(ez._events[blackMesaChange]).toBeFalsy();
}
function classProps() {
  const ez =  makeEz();
  const ConnectedBunker = ezReact.connect(ez, TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  const testBunker = tree.find('TestBunker').node;
  const initialProps = { name: 'Black Mesa', children: undefined };
  expect(testBunker.props).toEqual(initialProps);

  ez.actions.blackMesa.contain();
  expect(testBunker.props).toEqual(Object.assign(initialProps, ez.state.blackMesa));
  tree.unmount();
}
function classStartStop() {
  const ez =  makeEz();
  const ConnectedBunker = ezReact.connectClass(ez, TestBunker, testHandler);

  expect(ez._events[blackMesaChange]).toBeFalsy();
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  expect(ez._events[blackMesaChange]).toBeTruthy();
  tree.unmount();
  expect(ez._events[blackMesaChange]).toBeFalsy();
}


