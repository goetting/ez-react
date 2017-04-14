/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type StateHandler = (state: Object, props: any) => Object | void;
type StateHandlers = { [stateName: string]: StateHandler | string[] };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '2nd arg must be a React Component class or instance';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;
const isObj = obj => !!obj && typeof obj === 'object';
const isFn = fn => typeof fn === 'function';

export default function ezReact() {
  const createHandler = (keys): StateHandler =>
    (state) => {
      const newState = {};
      for (let i = keys.length; i--;) newState[keys[i]] = state[keys[i]];
      return newState;
    };
  const removeListeners = (handlers: EventHanlders): void => {
    for (let i = handlers.length; i--;) this.off(handlers[i].name, handlers[i].fn);
  };
  const addListeners = (instance: Object, handlers: StateHandlers): EventHanlders => {
    const activeHandlers: EventHanlders = [];
    const names: string[] = Object.keys(handlers);

    for (let i = names.length; i--;) {
      const name: string = names[i];
      const eventName: string = EZFlux.getEventNames(name).change;
      const handlerVal = handlers[name];
      const stateHandler = typeof handlerVal === 'function' ? handlerVal : createHandler(handlerVal);
      const fn = () => {
        if (instance.willUnmount) return;
        const stateScope = this.state[name];
        const newState: any = stateHandler(stateScope, instance.state);
        if (newState) instance.setState(newState);
      };
      activeHandlers.push({ name: eventName, fn });
      this.on(eventName, fn);
    }
    return activeHandlers;
  };
  const validateArguments = (component: any, handlers: StateHandlers): void => {
    if (!isObj(component) && !isFn(component)) throw new Error(badComponentMsg);
    if (!isObj(handlers)) throw new Error(badHandlersMsg);

    const names: string[] = Object.keys(handlers);
    const state: Object = this.state;

    for (let i = names.length; i--;) {
      const name = names[i];
      if (!isFn(handlers[name]) && !Array.isArray(handlers[name])) throw new Error(badHandlersMsg);
      if (!state[name]) throw new Error(getBadStateMsg(name));
    }
  };

  return {
    connect: (component: Object | Function, handlers: StateHandlers): Function | void => {
      if (isFn(component)) return this.plugins.connectClass(component, handlers);
      return this.plugins.connectInstance(component, handlers);
    },
    connectClass: (Component: Function, handlers: StateHandlers): Function => {
      validateArguments(Component, handlers);

      return class EZWrapper extends React.PureComponent {
        activeHandlers: EventHanlders = [];
        willUnmount: boolean = false;
        state: Object = {};
        props: any;

        componentDidMount() {
          this.activeHandlers = addListeners(this, handlers);
        }

        componentWillUnmount() {
          this.willUnmount = true;
          removeListeners(this.activeHandlers);
        }

        render() {
          const childProps = Object.assign({}, this.props, this.state);

          return React.createElement(Component, childProps, this.props.children);
        }
      };
    },
    connectInstance: (instance: Object, handlers: StateHandlers): void => {
      validateArguments(instance, handlers);

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
    },
  };
}
