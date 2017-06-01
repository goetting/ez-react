/* @flow *//* eslint-disable no-return-assign */
import React from 'react';

type Store = Object;
type Stores = { [storeName: string]: Store };
type StateHandler = (Store, props: any) => Object | void;
type Handler = StateHandler | string[];
type Handlers = { [storeName: string]: Handler };

const handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

export function normaliseHandler(handler: Handler): StateHandler {
  if (typeof handler === 'function') return handler;
  if (Array.isArray(handler)) return store => handler.reduce((a, k) => (a[k] = store[k], a), {});
  throw new Error(handlerErr);
}

export default function createConnector(stores: Stores): Function {
  return function (Component: Function, handlers: Handlers, initProps: Object = {}): Function {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (typeof handlers !== 'object') throw new Error(handlerErr);

    class EZWrapper extends React.PureComponent {
      isMounted: boolean = true;
      events: { name: string, fn: () => void }[];
      state: Object = initProps;
      props: Object;

      componentDidMount() {
        this.events = Object
          .keys(handlers)
          .map((name) => {
            if (!stores[name]) throw new Error(`store "${name}" unknown to this connector`);

            const stateHandler: StateHandler = normaliseHandler(handlers[name]);
            const store: Store = stores[name];
            const fn = () => {
              if (!this.isMounted) return;
              const newState: any = stateHandler(store, this.state);

              if (newState) this.setState(newState);
            };

            store.$on('change', fn);
            return { name, fn };
          });

        if (!this.events.length) throw new Error(handlerErr);
      }

      componentWillUnmount() {
        this.isMounted = false;
        this.events.forEach(e => stores[e.name].$off('change', e.fn));
      }

      render() {
        return <Component {...this.props} {...this.state} />;
      }
    };
  }
}
