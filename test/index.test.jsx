/* eslint-disable no-use-before-define */
import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { mountToJson, shallowToJson } from 'enzyme-to-json';
import { createConnect, createProvider } from '../src/index';
import { testHandler, TestBunker, makeStore } from './test-lib-data';
import raf from 'raf';

const waitRaf = () => new Promise((resolve) => raf(resolve));

describe('ezReact', () => {
  describe('createProvider', () => {
    it('should return a function', () => {
      expect(typeof createProvider()).toBe('function');
    });
  });

  describe('Provider', () => {
    it('should provide ezReact child context to children', () => {
      const blackMesa = makeStore();

      const assertion1 = (context) => expect(context).toBe(blackMesa);
      const assertion2 = (context) => expect(context).toBe(blackMesa);

      const Provider = createProvider(blackMesa);

      class TestComponent extends React.PureComponent {
        static contextTypes = Provider.childContextTypes;

        constructor(props, context) {
          super(props, context);
        }

        render() {
          return <div>{this.props.children}</div>;
        }
      };

      const tree = mount(<Provider store={blackMesa}>
        <TestComponent assertion={assertion1}>
          <TestComponent assertion={assertion2} />
        </TestComponent>
      </Provider>);
    });
  });

  describe('createConnect', () => {
    it('should return a function', () => {
      expect(typeof createConnect()).toBe('function');
    });
  });

  describe('connect', () => {
    const connect = createConnect();
    const Provider = createProvider();
    const ConnectedBunker = connect(TestBunker, testHandler);

    let store;
    beforeEach(() => store = makeStore());

    it('should throw if given component is not a function', () => {
      expect(() => {
        connect(null);
      }).toThrow();
    });

    it('should throw if given handlers not a map of functions', () => {
      expect(() => {
        connect(() => {}, null);
      }).toThrow();
    });

    it('should not blow up if propper params are given', () => {
      expect(() => {
        mount(<Provider store={store}>
          <ConnectedBunker name="Black Mesa" />
        </Provider>).unmount();
      }).not.toThrow();
    });

    it('should bind state to props', async () => {
      expect(ConnectedBunker.displayName).toBe('Connected(TestBunker)');
      const tree = mount(<Provider store={store}><ConnectedBunker name="Black Mesa" /></Provider>);
      expect(mountToJson(tree.find(ConnectedBunker))).toMatchSnapshot();

      const testBunker = tree.find('TestBunker');
      const initialProps = Object.assign(store.$copy(), { name: 'Black Mesa' });

      expect(tree.find('TestBunker').props()).toEqual(initialProps);

      store.startExperiment();
      store.contain();

      await waitRaf();

      tree.update();
      expect(tree.find('TestBunker').props()).toEqual(Object.assign(initialProps, store.$copy()));
      expect(mountToJson(tree.find(ConnectedBunker))).toMatchSnapshot();

      tree.unmount();
    });

    it('should start after mount and stop after unmount', () => {
        expect(store.$events.change).toBeFalsy();
        expect(store.$events.update).toBeFalsy();
        const tree = mount(<Provider store={store}><ConnectedBunker name="Black Mesa" /></Provider>);
        expect(store.$events.change.length).toBe(1);
        expect(store.$events.update.length).toBe(1);
        tree.unmount();
        expect(store.$events.change.length).toBe(0);
        expect(store.$events.update.length).toBe(0);
    });

    it('should provide a ref to the wrapped component if withRef is set', () => {
      const ConnectedBunkerWithRef = connect(TestBunker, testHandler, { withRef: true });
      const tree = mount(<Provider store={store}><ConnectedBunkerWithRef name="Black Mesa" /></Provider>);
  
      const { wrappedComponent } = tree.find(ConnectedBunkerWithRef).instance().refs;
      expect(wrappedComponent).toBeInstanceOf(TestBunker);
    })

    it('should not cause state contamination by props', async () => {
      // Wrapper allows us to emulate the changing of whole props by removing props with undefined value
      // In a real use case if you pass props to the connected component via spread operator, this should
      // emulate the case where you are removing a key from the props object during an update.
      const Wrapper = props => <Provider store={store}><ConnectedBunker
        {
          ...Object.keys(props).reduce(
            (acc, key) => (props[key] === undefined ? acc : Object.assign(acc, { [key]: props[key] })),
            {},
          )
        }
      /></Provider>;

      const wrapper = mount(<Wrapper />);

      wrapper.setProps({ name: 'Black Mesa', isDangerous: true });
      const propsBefore = wrapper.find(TestBunker).props();
      expect(propsBefore.name).toBe('Black Mesa');
      expect(propsBefore.isDangerous).toBe(true);

      wrapper.setProps({ name: 'White Mesa', isDangerous: undefined });
      const propsAfter = wrapper.find(TestBunker).props();
      expect(propsAfter.name).toBe('White Mesa');
      expect(propsAfter.isDangerous).toBe(undefined);
    });
  });
});