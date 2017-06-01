/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type Store = Object;
type Stores = { [storeName: string]: Store };
type StateHandler = (Store, props: any) => Object | void;
type Handler = StateHandler | string[];
type Handlers = { [storeName: string]: Handler };

const handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

function normalise(handler: Handler): StateHandler {
  if (typeof handler === 'function') return handler;
  if (Array.isArray(handler)) return store => handler.reduce((acc, k) => acc[k] = store[k], {});
  throw new Error(handlerErr);
}

export default function createConnector(stores: Stores): Function {
  return (Component: Function, handlers: Handlers, initProps: Object = {}): Function =>
    class EZWrapper extends React.PureComponent {
      isMounted: boolean = true;
      events: { name: string, fn: () => void }[];
      state: Object = initProps;
      props: Object;

      componentDidMount() {
        if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
        if (typeof handlers !== 'object') throw new Error(handlerErr);

        this.events = Object
          .keys(handlers)
          .map((name) => {
            if (!stores[name]) throw new Error(`store "${name}" unknown to this connector`);

            const stateHandler: StateHandler = normalise(handlers[name]);
            const store: Store = stores[name];
            const fn = () => {
              if (!this.isMounted) return;
              const newState: any = stateHandler(store, this.state);

              if (newState) this.setState(newState);
            };

            store.$on('change', fn);
            return { name, fn };
          });
      }

      componentWillUnmount() {
        this.isMounted = false;
        this.events.forEach(e => stores[e.name].$off('change', e.fn));
      }

      render() {
        return <Component { ...this.props } { ...this.state } />;
      }
    };
}
