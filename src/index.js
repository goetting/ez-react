/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type EZInst = typeof EZFlux;
type StateHandlers = { [stateName: string]: (state: Object, props: any) => Object | void };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '2nd arg must be a React Component class or instance';
const badEzFluxMsg = '1st arg must be ezFlux instance. you may also use ezReact.addConnector pattern';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;
const isObj = obj => !!obj && typeof obj === 'object';

function addListeners(instance: Object, handlers: StateHandlers, ezFlux: EZInst): EventHanlders {
  const activeHandlers: EventHanlders = [];
  const names: string[] = Object.keys(handlers);

  for (let i = names.length; i--;) {
    const name: string = names[i];
    const eventName: string = EZFlux.getChangeEventName(name);
    const fn = () => {
      const stateScope = ezFlux.state[name];
      const newState: any = handlers[name](stateScope, instance.state);

      if (newState && typeof newState === 'object') instance.setState(newState);
    };
    activeHandlers.push({ name: eventName, fn });
    ezFlux.on(eventName, fn);
  }
  return activeHandlers;
}

function removeListeners(handlers: EventHanlders, ezFlux: EZInst) {
  for (let i = handlers.length; i--;) ezFlux.removeListener(handlers[i].name, handlers[i].fn);
}

const ezReact = {
  validateArguments(ezFlux: EZInst, component: any, handlers: StateHandlers): void {
    if (!(ezFlux instanceof EZFlux)) throw new Error(badEzFluxMsg);
    if (!isObj(component) && typeof component !== 'function') throw new Error(badComponentMsg);
    if (!isObj(handlers)) throw new Error(badHandlersMsg);

    const names: string[] = Object.keys(handlers);
    const state: Object = ezFlux.state;

    for (let i = names.length; i--;) {
      if (typeof handlers[names[i]] !== 'function') throw new Error(badHandlersMsg);
      if (!state[names[i]]) throw new Error(getBadStateMsg(names[i]));
    }
  },

  connect(...args: any[]): Function | void {
    if (typeof args[1] === 'function') return ezReact.connectClass(...args);
    return ezReact.connectInstance(...args);
  },

  connectInstance(ezFlux: EZInst, instance: Object, handlers: StateHandlers): void {
    ezReact.validateArguments(ezFlux, instance, handlers);
    const { componentDidMount, componentWillUnmount } = instance;
    let activeHandlers: EventHanlders = [];

    instance.componentDidMount = (...args): void => {
      activeHandlers = addListeners(instance, handlers, ezFlux);
      if (componentDidMount) componentDidMount.apply(instance, args);
    };

    instance.componentWillUnmount = (...args) => {
      removeListeners(activeHandlers, ezFlux);
      if (componentWillUnmount) componentWillUnmount.apply(instance, args);
    };
  },

  connectClass(ezFlux: EZInst, Component: Function, handlers: StateHandlers): Function {
    ezReact.validateArguments(ezFlux, Component, handlers);

    return class EZWrapper extends React.PureComponent {
      activeHandlers: EventHanlders = [];
      state: Object = {};
      props: any;

      componentDidMount() {
        this.activeHandlers = addListeners(this, handlers, ezFlux);
      }

      componentWillUnmount() {
        removeListeners(this.activeHandlers, ezFlux);
      }

      render() {
        const childProps = Object.assign({}, this.props, this.state);

        return React.createElement(Component, childProps, this.props.children);
      }
    };
  },
};

export default ezReact;
export const validateArguments = ezReact.validateArguments;
export const connectInstance = ezReact.connectInstance;
export const connectClass = ezReact.connectClass;
export const connect = ezReact.connect;
