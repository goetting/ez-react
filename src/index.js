/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type StateHandlers = { [stateName: string]: (state: Object, props: any) => Object | void };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
const badComponentMsg = '2nd arg must be a React Component class or instance';
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;
const isObj = obj => !!obj && typeof obj === 'object';
const isFn = fn => typeof fn === 'function';

export default function ezReact() {
  const removeListeners = (handlers: EventHanlders): void => {
    for (let i = handlers.length; i--;) this.off(handlers[i].name, handlers[i].fn);
  };
  const addListeners = (instance: Object, handlers: StateHandlers): EventHanlders => {
    const activeHandlers: EventHanlders = [];
    const names: string[] = Object.keys(handlers);

    for (let i = names.length; i--;) {
      const name: string = names[i];
      const eventName: string = EZFlux.getEventNames(name).change;
      const fn = () => {
        if (instance.willUnmount) return;
        const stateScope = this.state[name];
        const newState: any = handlers[name](stateScope, instance.state);
        if (newState && typeof newState === 'object') instance.setState(newState);
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
      if (!isFn(handlers[names[i]])) throw new Error(badHandlersMsg);
      if (!state[names[i]]) throw new Error(getBadStateMsg(names[i]));
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
