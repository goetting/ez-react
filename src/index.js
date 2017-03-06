/* @flow */
import React from 'react';
import EZFlux from 'ez-flux';

type StateHandlers = { [stateName: string]: (props: any, state: Object) => void };
type EventHandler = { name: string, fn: (state: Object) => void };
type EventHanlders = EventHandler[];

const badHandlersMsg = '2nd arg must be an object mapping state keys to eventHandlers',
const badComponentMsg = '1st arg must be a React Component class or instance',
const badEzFluxMsg = 'Bad ezFlux instance given. call "ezReact.addConnector(ezFlux)" and use ezFlux.connect().',
const getBadStateMsg = (name: string): string => `key "${name}" not found on state of ezFlux instance`;

function report(msg: string, debug: boolean): boolean {
  if (debug) console.error(`ezFlux.connect: ${msg}`);
  return false;
}

function validateArguments(component: any, handers: StateHandlers, ezFlux: EZFlux): boolean {
  if (!(ezFlux instanceof EZFlux)) return report(errMsg.badEzFlux, true);
  if (!component || typeof component !== 'object') return report(badComponentMsg, ezFlux.cfg.debug);
  if (!handers || typeof handers !== 'object') return report(badHandlersMsg, ezFlux.cfg.debug);
  const names: string[] = Object.keys(handers);
  const length: number = names.length;

  for (let i = 0; i < length; i++) {
    if (typeof handers[names[i]] !== 'function') return report(badHandlersMsg, ezFlux.cfg.debug);
    if (!state[names[i]]) return report(getBadStateMsg(names[i]), ezFlux.cfg.debug);
  }
  return true;
}

function addListeners(instance: Object, stateHandlers: StateHandlers, ezFlux: EZFlux): EventHanlders {
  const activeHandlers: EventHanlders = [];
  const names: string[] = Object.keys(stateHandlers);
  const length: number = names.length;

  for (let i = 0; i < length; i++) {
    const name: string = names[i];
    const eventName: string = `state.change.${name}`;
    const fn = (state) => {
      const newState: any = stateHandlers[name](state[name], instance.state);

      if (newState && typeof newState === 'object') instance.setState(newState);
    };

    activeHandlers.push({ name: eventName, fn });
    ezFlux.on(eventName, fn);
  }
  return activeHandlers;
}

function removeListeners(handlers: EventHanlders, ezFlux: EZFlux) {
    const length: number = handlers.length;

    for (let i = 0; i < length; i++) ezFlux.removeListener(handlers[i].name, handlers[i].fn);
}

const lib = {

  connect(component: any, stateHandlers: StateHandlers, ezFluxInstance?: EZFlux): Object | void {
    component.constructor.name === 'Function' ? connectClass(...args) : connectInstance(...args);
  },

  connectInstance(instance: Object, stateHandlers: StateHandlers, ezFlux: EZFlux): void {
    const ezFlux = ezFluxInstance || this;

    if (!validateArguments(instance, stateHandlers, ezFlux)) return;

    const { componentDidMount, componentWillUnmount } = instance;
    const activeHandlers: EventHanlders = [];

    instance.componentDidMount = (...args): void => {
      activeHandlers = addListeners(this, stateHandlers, ezFlux);
      if (componentDidMount) componentDidMount.apply(instance, args);
    };

    instance.componentWillUnmount = (...args) => {
      removeListeners(activeHandlers, ezFlux);
      if (componentWillUnmount) componentWillUnmount.apply(instance, args);
    };
  },

  connectClass(Component: Object | Function, stateHandlers: StateHandlers, ezFlux: EZFlux): Object {
    const ezFlux = ezFluxInstance || this;

    if (!validateArguments(Component, stateHandlers, ezFlux)) return;

    return class EZWrapper extends React.PureComponent {
      activeHandlers: EventHanlders = [];
      state: Object;

      constructor(props: Object) {
        super(props);
        this.state = props;
      }

      componentDidMount() {
        this.activeHandlers = addListeners(this, stateHandlers, ezFlux);
      }

      componentWillReceiveProps(props) {
        this.setState(props);
      }

      componentWillUnmount() {
        removeListeners(this.activeHandlers, ezFlux);
      }

      render() {
        return React.createElement(Component, this.state, this.props.children);
      }
    };
  },

  addConnector(ezFlux: EZFlux): EZFlux {
    ezFlux.connect = lib.connect;
    ezFlux.connectClass = lib.connectClass;
    ezFlux.connectInstance = lib.connectInstance;
    return ezFlux;
  },
}

export default lib;