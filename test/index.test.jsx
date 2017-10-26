/* eslint-disable no-use-before-define */
import React from 'react';
import { mount } from 'enzyme';
import { mountToJson } from 'enzyme-to-json';
import createConnector from '../src/index';
import { testHandler, TestBunker, makeStore } from './test-lib-data';
import raf from 'raf';

const waitRaf = () => new Promise((resolve) => raf(resolve));

describe('ezReact', () => {
  describe('createConnector', () => {
    it('should return a function', createCon);
  });
  describe('connect', () => {
    it('should throw if given component is not a function', connectNoComponent);
    it('should throw if given handlers not a map of functions', connectNoHandlers);
    it('should not blow up if propper params are given', connectWorks);
    it('should bind state to props', connectBindStateToProps);
    it('should start after mount and stop after unmount', connectTiming);
    it('should not add store listeners if disabled in createConnector', connectNoListener);
    it('should not cause state contamination by props', stateContaminationByProps);
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


function connectWorks() {
  const blackMesa = makeStore();;
  const connect = createConnector(blackMesa);
  const ConnectedBunker = connect(TestBunker, testHandler);
  let threw = false;
  try {
    mount(<ConnectedBunker name="Black Mesa" />).unmount();
  } catch (e) {
    console.log(e);
    threw = true;
  }
  expect(threw).toBe(false);
}

async function connectBindStateToProps() {
  const blackMesa = makeStore();
  const connect = createConnector(blackMesa);
  const ConnectedBunker = connect(TestBunker, testHandler);
  expect(ConnectedBunker.displayName).toBe('EZWrapper(TestBunker)');
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  expect(mountToJson(tree)).toMatchSnapshot();

  const testBunker = tree.find('TestBunker');
  const initialProps = Object.assign(blackMesa.$copy(), { name: 'Black Mesa' });

  expect(tree.find('TestBunker').props()).toEqual(initialProps);

  blackMesa.startExperiment();
  blackMesa.contain();

  await waitRaf();

  tree.update();
  expect(tree.find('TestBunker').props()).toEqual(Object.assign(initialProps, blackMesa.$copy()));
  expect(mountToJson(tree)).toMatchSnapshot();

  tree.unmount();
}

function connectTiming() {
  const blackMesa = makeStore();
  const connect = createConnector(blackMesa);
  const ConnectedBunker = connect(TestBunker, testHandler);

  expect(blackMesa.$events.change.length).toBe(1);
  expect(blackMesa.$events.update).toBeFalsy();
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  expect(blackMesa.$events.change.length).toBe(1);
  expect(blackMesa.$events.update.length).toBe(1);
  tree.unmount();
  expect(blackMesa.$events.change.length).toBe(1);
  expect(blackMesa.$events.update.length).toBe(0);
}

function connectNoListener() {
  const blackMesa = makeStore();
  const connect = createConnector(blackMesa, { shouldListen: false });
  const ConnectedBunker = connect(TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa" />);
  expect(blackMesa.$events.update).toBe(undefined);

  tree.unmount();
}

function connectWrappedComponentRef() {
  const blackMesa = makeStore();
  const connect = createConnector({ blackMesa }, { shouldListen: false });
  const ConnectedBunker = connect(TestBunker, testHandler);
  const tree = mount(<ConnectedBunker name="Black Mesa" />);

  const { wrappedComponent } = tree.instance();

  expect(wrappedComponent).toBeInstanceOf(TestBunker);
}

function stateContaminationByProps() {
  const blackMesa = makeStore();
  const connect = createConnector(blackMesa, { shouldListen: false });
  const ConnectedBunker = connect(
    props => <div>{JSON.stringify(props)}</div>,
    testHandler,
  );

  // Wrapper allows us to emulate the cahnging of whole props by removing props with undefined value
  // In a real use case if you pass props to the connected component via spread operator, this should
  // emulate the case where you are removing a key from the props object during an update.
  const Wrapper = props => <ConnectedBunker
    {
      ...Object.keys(props).reduce(
        (acc, key) => (props[key] === undefined ? acc : Object.assign(acc, { [key]: props[key] })),
        {},
      )
    }
  />;

  const wrapper = mount(<Wrapper />);
  const withLeafProps = callback => callback(JSON.parse(wrapper.text()));

  wrapper.setProps({ name: 'Black Mesa', isDangerous: true });
  withLeafProps(({ name, isDangerous }) => {
    expect(name).toBe('Black Mesa');
    expect(isDangerous).toBe(true);
  });

  wrapper.setProps({ name: 'White Mesa', isDangerous: undefined });
  withLeafProps(({ name, isDangerous }) => {
    expect(name).toBe('White Mesa');
    expect(isDangerous).toBeUndefined();
  });
}