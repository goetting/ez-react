/* @flow *//* eslint-disable no-return-assign, react/sort-comp */
import React from 'react';

type Store = Object;
type Options = { shouldListen: boolean };
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

export default function createConnector(
  stores: Stores,
  opts: Options = { shouldListen: true },
): Function {
  return function connect(Component: Function, handlers: Handlers): Function {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (!handlers || typeof handlers !== 'object') throw new Error(handlerErr);

    const storeHandlers: StoreHandlers = Object
      .keys(handlers)
      .filter((k) => { if (!stores[k]) throw new Error(`store "${k}" not found`); return true; })
      .map(k => ({ handler: normaliseHandler(handlers[k]), store: stores[k] }));

    return class EZWrapper extends React.Component {
      events: Events;
      state: Object;
      props: Object;

      constructor(props) {
        super(props);
        this.state = {};
      }

      componentWillMount() {
        this.events = storeHandlers.map(({ store, handler }) => {
          const listener = () => {
            const newState: any = handler(store, { ...this.state, ...this.props });

            if (newState) this.setState(newState);
          };

          if (opts.shouldListen) store.$on('change', listener);
          listener();
          return { store, listener };
        });
      }

      componentWillUnmount() {
        if (opts.shouldListen) this.events.forEach(e => e.store.$off('change', e.listener));
      }

      render() {
        return <Component {...this.state} {...this.props} />;
      }
    };
  };
}
