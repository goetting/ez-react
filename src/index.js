/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type EZInst = typeof EZFlux;
type StateHandlers = { [stateName: string]: (state: Object, props: any) => Object | void };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '2nd arg must be a React Component class or instance';
const badEzFluxMsg = 'ezReact functions must be plugged into EZFlux instance';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;
const isObj = obj => !!obj && typeof obj === 'object';

function addListeners(instance: Object, handlers: StateHandlers, ezFlux: EZInst): EventHanlders {
  const activeHandlers: EventHanlders = [];
  const names: string[] = Object.keys(handlers);

  for (let i = names.length; i--;) {
    const name: string = names[i];
    const eventName: string = EZFlux.getEventNames(name).change;
    const fn = () => {
      if (instance.willUnmount) return;
      const stateScope = ezFlux.state[name];
      const newState: any = handlers[name](stateScope, instance.state);
      if (newState && typeof newState === 'object') instance.setState(newState);
    };
    activeHandlers.push({ name: eventName, fn });
    ezFlux.on(eventName, fn);
  }
  return activeHandlers;
}

function removeListeners(handlers: EventHanlders, ezFlux: EZInst): void {
  for (let i = handlers.length; i--;) {
    ezFlux.off(handlers[i].name, handlers[i].fn);
  }
}

function validateArguments(ezFlux: EZInst, component: any, handlers: StateHandlers): void {
  if (!(ezFlux instanceof EZFlux)) throw new Error(badEzFluxMsg);
  if (!isObj(component) && typeof component !== 'function') throw new Error(badComponentMsg);
  if (!isObj(handlers)) throw new Error(badHandlersMsg);

  const names: string[] = Object.keys(handlers);
  const state: Object = ezFlux.state;

  for (let i = names.length; i--;) {
    if (typeof handlers[names[i]] !== 'function') throw new Error(badHandlersMsg);
    if (!state[names[i]]) throw new Error(getBadStateMsg(names[i]));
  }
}


export function connect(component: Object | Function, handlers: StateHandlers): Function | void {
  if (typeof component === 'function') return this.plugins.connectClass(component, handlers);
  return this.plugins.connectInstance(component, handlers);
}

export function connectInstance(instance: Object, handlers: StateHandlers): void {
  validateArguments(this, instance, handlers);
  const { componentDidMount, componentWillUnmount } = instance;
  let activeHandlers: EventHanlders = [];

  instance.willUnmount = false;

  instance.componentDidMount = (...args): void => {
    activeHandlers = addListeners(instance, handlers, this);
    if (componentDidMount) componentDidMount.apply(instance, args);
  };

  instance.componentWillUnmount = (...args) => {
    instance.willUnmount = true;
    removeListeners(activeHandlers, this);
    if (componentWillUnmount) componentWillUnmount.apply(instance, args);
  };
}

export function connectClass(Component: Function, handlers: StateHandlers): Function {
  const ezFlux = this;

  validateArguments(ezFlux, Component, handlers);

  return class EZWrapper extends React.PureComponent {
    activeHandlers: EventHanlders = [];
    willUnmount: boolean = false;
    state: Object = {};
    props: any;

    componentDidMount() {
      this.activeHandlers = addListeners(this, handlers, ezFlux);
    }

    componentWillUnmount() {
      this.willUnmount = true;
      removeListeners(this.activeHandlers, ezFlux);
    }

    render() {
      const childProps = Object.assign({}, this.props, this.state);

      return React.createElement(Component, childProps, this.props.children);
    }
  };
}

export const plugins = [
  connect,
  connectClass,
  connectInstance,
];

export default {
  plugins,
  connect,
  connectClass,
  connectInstance,
};
