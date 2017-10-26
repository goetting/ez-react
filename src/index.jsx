/* @flow */
/* eslint-disable no-return-assign, react/sort-comp */
import * as React from 'react';

type Store = Object;
type Options = { shouldListen: boolean };
type Stores = { [storeName: string]: Store };
type StoreHandler = (Store, props: Object) => Object | void;
type StoreHandlers = { store: Store, handler: StoreHandler }[];

const handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

export default function createConnector(
  store: Store,
  opts: Options = { shouldListen: true },
): Function {
  return function connect<T: Object>(Component: React.ComponentType<T>, handler: StoreHandler): Function {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (!handler || typeof handler !== 'function') throw new Error('2nd arg must be an function');

    let updateRequest;

    const update = () => {
      if (updateRequest) window.cancelAnimationFrame(updateRequest);
      updateRequest = window.requestAnimationFrame(() => store.$emit('update'));
    }

    store.$on('change', update);

    return class EZWrapper extends React.Component<T, Object> {
      wrappedComponent: React.Ref<Component>;
      // Set a readable displayName
      static displayName = `EZWrapper(${Component.name})`;

      storeListener: () => void;

      constructor(props) {
        super(props);
        this.state = {};
      }

      componentWillMount() {
        const listener = () => {
          const newState: any = handler(store, { ...this.state, ...this.props });
          if (newState) this.setState(newState);
        };

        if (opts.shouldListen) {
          store.$on('update', listener);
          this.storeListener = listener;
        }

        listener();
      }

      componentWillUnmount() {
        if (opts.shouldListen) store.$off('update', this.storeListener);
      }

      getComponentProps() {
        return { ...this.state, ...this.props };
      }

      render() {
        return <Component {...this.getComponentProps()}/>;
      }
    };
  };
}
