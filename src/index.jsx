/* @flow *//* eslint-disable no-return-assign, react/sort-comp */
import React from 'react';

type Store = Object;
type Stores = { [storeName: string]: Store };
type StoreHandler = (Store, props: Object) => Object | void;
type StoreHandlers = { store: Store, handler: StoreHandler }[];
type Handler = StoreHandler | string[];
type Handlers = { [storeName: string]: Handler };
type Events = { store: Store, listener: () => void }[];

const handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

export function normaliseHandler(handler: Handler): StoreHandler {
  if (typeof handler === 'function') return handler;
  if (Array.isArray(handler)) {
    return store => handler.reduce((acc, k) => { acc[k] = store[k]; return acc; }, {});
  }
  throw new Error(handlerErr);
}

export default function createConnector(stores: Stores): Function {
  return function connect(Component: Function, handlers: Handlers): Function {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (!handlers || typeof handlers !== 'object') throw new Error(handlerErr);

    const storeHandlers: StoreHandlers = Object
      .keys(handlers)
      .filter((k) => { if (!stores[k]) throw new Error(`store "${k}" not found`); return true; })
      .map(k => ({ handler: normaliseHandler(handlers[k]), store: stores[k] }));

    return class EZWrapper extends React.PureComponent {
      events: Events;
      state: Object = {};
      props: Object;

      componentWillMount() {
        this.events = storeHandlers
          .map(({ store, handler }) => {
            const listener = () => {
              const props: any = handler(store, { ...this.props, ...this.state });
              if (props) this.setState(props);
            };
            listener();
            return { store, listener };
          });
      }

      componentDidMount() {
        this.events.forEach(e => e.store.$on('change', e.listener));
      }

      componentWillUnmount() {
        this.events.forEach(e => e.store.$off('change', e.listener));
      }

      render() {
        return <Component {...this.props} {...this.state} />;
      }
    };
  };
}
