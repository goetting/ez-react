/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type StateHandler = (state: Object, props: any) => Object | void;

const badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '2nd arg must be a React Component class or instance';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;

const isFn = fn => typeof fn === 'function';

export default function createConnector(stores) =>
  const validateArguments = (component: any, handlers: Handlers): void => {
    if (!isFn(component)) throw new Error(badComponentMsg);
    if (handlers && typeof handlers === 'object') throw new Error(badHandlersMsg);

    const names: string[] = Object.keys(handlers);

    for (let i = names.length; i--;) {
      const name = names[i];
      if (!isFn(handlers[name]) && !Array.isArray(handlers[name])) throw new Error(badHandlersMsg);
      if (!stores[name]) throw new Error(getBadStateMsg(name));
    }
  };

  const createHandler = (keys): StateHandler =>
    (store) => {
      const newState = {};
      for (let i = keys.length; i--;) newState[keys[i]] = store[keys[i]];
      return newState;
    };

  const addListeners = (instance: Object, handlers: Handlers): Function[] =>
    Object
      .keys(handlers)
      .map((name) => {
        const stateHandler = isFn(handlers[name]) ? handlers[name] : createHandler(handlers[name]);
        const store = stores[name];
        const fn = () => {
          if (instance.willUnmount) return;
          const newState: any = stateHandler(store, instance.state);

          if (newState) instance.setState(newState);
        };
        store.$on('change', fn);
        return () => store.$off('change', fn);
      });

  return function connect(Component: Function, handlers: Handlers, initProps: Object): Function => {
      validateArguments(Component, handlers);

      return class EZWrapper extends React.Component {
        eventRemovers: Function[] = [];
        willUnmount: boolean = false;
        state: Object = initProps || {};
        props: Object;

        componentDidMount() {
          this.eventRemovers = addListeners(this, handlers);
        }

        componentWillUnmount() {
          this.willUnmount = true;
          this.eventRemovers.forEach(fn => fn());
        }

        render() {
          const childProps = Object.assign({}, this.props, this.state);

          return React.createElement(Component, childProps, this.props.children);
        }
      };
    },
}
