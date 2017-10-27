/* @flow */
/* eslint-disable no-return-assign, react/sort-comp */
import * as React from 'react';
import PropTypes from 'prop-types';

type Store = Object;
type Options = { shouldListen: boolean };
type Stores = { [storeName: string]: Store };
type StoreHandler = (Store, props: Object) => Object | void;
type StoreHandlers = { store: Store, handler: StoreHandler }[];

type ProviderProps = { store: Store, children: React.Node };
type ConnectOptions = { withRef?: boolean };

export function createProvider(key: string = 'store') {
  class Provider extends React.PureComponent<ProviderProps> {

    store: Store;

    constructor(props: ProviderProps, context: any) {
      super(props, context);
      this.store = props.store;
    }

    getChildContext() {
      return { [key]: this.store };
    }

    render() {
      return this.props.children;
    }
  }

  Provider.childContextTypes = { [key]: PropTypes.object };

  return Provider;
}

export function createConnect<T>(key: string = 'store') {
  return function connect<T: Object>(Component: React.ComponentType<T>, handler: StoreHandler, options: ConnectOptions = {}): Function {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (!handler || typeof handler !== 'function') throw new Error('2nd arg must be an function');

    return class Connect extends React.PureComponent<T, any> {
      static contextTypes = { [key]: PropTypes.object };
      static displayName = `Connected(${Component.name})`;

      // Set a readable displayName
      updateRequest: number;

      store: Store;

      onChange: () => any;
      onUpdate: () => any;

      constructor(props, context: { [key :string]: Store }) {
        super(props, context);
        this.state = {};

        const store = context[key];
        this.store = store;

        this.onChange = this.onChange.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
      }

      onChange() {
        const { store } = this;
        if (this.updateRequest) window.cancelAnimationFrame(this.updateRequest);
        this.updateRequest = window.requestAnimationFrame(() => store.$emit('update'));
      }

      onUpdate() {
        const { store } = this;
        if (!store) throw new Error('Missing Provider wrapper.');

        const newState: any = handler(store, { ...this.state, ...this.props });
        if (newState) this.setState(newState);
      }

      componentWillMount() {
        const { store } = this;
        if (!store) throw new Error('Missing Provider wrapper.');

        store.$on('change', this.onChange);
        store.$on('update', this.onUpdate);

        this.onUpdate();
      }

      componentWillUnmount() {
        const { store } = this;
        if (!store) throw new Error('Missing Provider wrapper.');

        store.$off('update', this.onUpdate);
        store.$off('change', this.onChange);
      }

      getComponentProps() {
        return { ...this.state, ...this.props };
      }

      render() {
        const props = {};
        if (options.withRef) props.ref = 'wrappedComponent';

        return <Component {...props} {...this.getComponentProps()}/>;
      }
    }
  }
}