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

const blackMesaChange = EZFlux.getEventNames('blackMesa').change;

function connectClass() {
  const ez =  makeEz();
  console.log({ez});
  const actualConnectClass = ez.plugins.connectClass;
  const mockFn = jest.fn();

  ez.plugins.connectClass = mockFn;
  const Comp = ez.plugins.connect(TestBunker, testHandler);

  ez.plugins.connectClass = actualConnectClass;
  expect(mockFn).toHaveBeenCalled();
}
function connectInstance() {
  const ez =  makeEz();
  const actualConnectInstance = ez.plugins.connectInstance;
  const mockFn = jest.fn();

  ez.plugins.connectInstance = mockFn;
  const Comp = ez.plugins.connect(<TestBunker name="Black Mesa" />, testHandler)

  ez.plugins.connectInstance = actualConnectInstance;
  expect(mockFn).toHaveBeenCalled();
}
function validArgsNoEZFlux() {
  const err = tryCatch(() => ez.plugins.connect({ crap: true}, TestBunker, testHandler));

  expect(err).toBeTruthy();
}
function validArgsNoComponent() {
  const ez =  makeEz();
  let err = tryCatch(() => ez.plugins.connect(null, testHandler));

  expect(err).toBeTruthy();

  err = tryCatch(() => ez.plugins.connect(undefined, testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ez.plugins.connect('check me out!', testHandler));
  expect(err).toBeTruthy();

  err = tryCatch(() => ez.plugins.connect(1337, testHandler));
  expect(err).toBeTruthy();
}
function validArgsNoHandlers() {
  const ez =  makeEz();
  const err = tryCatch(() => ez.plugins.connect(TestBunker, 'fuuuu'));

  expect(err).toBeTruthy();
}
function validArgsNoValidState() {
  const ez =  makeEz();
  let err = tryCatch(() => ez.plugins.connect(TestBunker, { crap: () => {} }));

  expect(err).toBeTruthy();
  err = tryCatch(() => ez.plugins.connect(TestBunker, { blackMesa: true }));
  expect(err).toBeTruthy();
}
async function instanceBindState() {
  const ez =  makeEz();
  let connectedTestBunkerInst = null;
  const ConnectedTestBunker = makeTestBunker((inst) => {
    connectedTestBunkerInst = inst;
    ez.plugins.connect(inst, testHandler);
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
    ez.plugins.connectInstance(inst, testHandler);
  });

  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeFalsy();
  const tree = mount(<ConnectedTestBunker name="Black Mesa" />);
  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeTruthy();
  tree.unmount();
  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeFalsy();
}
async function classProps() {
  const ez =  makeEz();
  const ConnectedBunker = ez.plugins.connect(TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  const testBunker = tree.find('TestBunker').node;
  const initialProps = { name: 'Black Mesa', children: undefined };
  expect(testBunker.props).toEqual(initialProps);

  await ez.actions.blackMesa.contain();
  expect(testBunker.props).toEqual(Object.assign(initialProps, ez.state.blackMesa));
  tree.unmount();
}
function classStartStop() {
  const ez = makeEz();
  const ConnectedBunker = ez.plugins.connectClass(TestBunker, testHandler);

  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeFalsy();
  const tree = mount(<ConnectedBunker name="Black Mesa"/>);
  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeTruthy();
  tree.unmount();
  expect(ez.events[blackMesaChange] && ez.events[blackMesaChange].length).toBeFalsy();
}


