/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type EZInst = typeof EZFlux;
type StateHandlers = { [stateName: string]: (props: any, state: Object) => void };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '2nd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '1st arg must be a React Component class or instance';
const badEzFluxMsg = '3rd arg must be ezFlux instance. you may also use ezReact.addConnector pattern';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;
const isObj = obj => !!obj && typeof obj === 'object';

function addListeners(instance: Object, handlers: StateHandlers, ezFlux: EZInst): EventHanlders {
  const activeHandlers: EventHanlders = [];
  const names: string[] = Object.keys(handlers);

  for (let i = names.length; i--;) {
    const name: string = names[i];
    const eventName: string = `state.change.${name}`;
    const fn = (state) => {
      const newState: any = handlers[name](state[name], instance.state);

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
  validateArguments(component: any, handlers: StateHandlers, ezFlux: EZInst): void {
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
    if (typeof args[0] === 'function') return ezReact.connectClass(...args);
    return ezReact.connectInstance(...args);
  },

  connectInstance(instance: Object, handlers: StateHandlers, ezFlux: EZInst): void {
    ezReact.validateArguments(instance, handlers, ezFlux);
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

  connectClass(Component: Function, handlers: StateHandlers, ezFlux: EZInst): Function {
    ezReact.validateArguments(Component, handlers, ezFlux);

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

  addConnector(ezFlux: EZInst): EZInst {
    ezFlux.connect = function wrapConnect(...args: any[]): Function | void {
      return ezReact.connect(...args, ezFlux);
    };
    ezFlux.connectClass = function connectClassWithEZFlux(
      Component: Function,
      handlers: StateHandlers,
    ): Function {
      return ezReact.connectClass(Component, handlers, ezFlux);
    };
    ezFlux.connectInstance = function connectInstanceWithEZFlux(
      instance: Object,
      handlers: StateHandlers,
    ): void {
      return ezReact.connectInstance(instance, handlers, ezFlux);
    };
    return ezFlux;
  },
};

export default ezReact;
