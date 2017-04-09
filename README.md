# ezReact (WIP)

ezReact offers a small connector to hook up React components with the ezFlux event and state system.


-   [Install](#install)
-   [Usage](#usage)
-   [API Documentation](#api-documentation)
    -   [connectClass](#connectclass)
    -   [connectInstance](#connectinstance)
    -   [connect](#connect)
-   [Contributing](#contributing)

# Install

simply install through npm.
ll

[NPM](https://npmjs.com):

```sh
$ npm install ez-react --save
```

[Yarn](https://yarnpkg.com/):

```sh
$ yarn add ez-react
```

# Usage

ezReact.connectClass expects a component and an Object that maps state namespaces to event handlers.
An event handler is called after ezFlux updates the state that was specified as its key.
It will receive the updated ezFlux.state as well as the current props given from its parent.
Its return value will be assigned to the component.

Assume an ezFlux instance with ezReact in your app.js:

```JS
import EZFlux from 'ez-flux';
import ezReact from 'ez-react';

export default new EZFlux({
  blackMesa: {
    values: { status: 'All systems are green.' },
    actions: { runExperiment: () => { status: 'Please stay calm.' } },
  }
}, {
  plugins: [ezReact],
});
```

#### Connect Component Class / Function

```jsx
import React from 'react';
import ezFlux from './app.js';

const BlackMesa = ({ motto, status }) => (
  <div>Welcome to Black Mesa Research Facility.</div>
  <div>"{motto}"</div>
  <div>{status}</div>
);

const ConnectedBlackMesa = ezFlux.plugins.connectClass(
  BlackMesa,
  { blackMesa: values => values },
);

export default ConnectedBlackMesa;
```

After mounting the component initially:

```jsx
import BlackMesa from './components/black-mesa';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<BlackMesa motto="Working to make a better tomorrow." />, 'bunker-id');

```

Your output will be:

```
Welcome to Black Mesa Research Facility.
"Working to make a better tomorrow."
All systems are green.

```

After triggering the action to run the experiment, anywhere else in your code ...

```JS
ezFlux.actions.blackMesa.runExperiment();
```

... your output will automatically become:

```
Welcome to Black Mesa Research Facility.
"Working to make a better tomorrow."
Please stay calm.
```

#### Connect Component Instance

You may also connect the instance directly within its constructor.

```jsx
import React from 'react';
import ezFlux from './app.js';


class BlackMesa extends React.Component {
  constructor(props) {
    super(props);
    this.state = { status: ezFlux.state.blackMesa.status };

    ezFlux.plugins.connectInstance(this, { blackMesa: values => values });
  }

  render() {
    return (
      <div>Welcome to Black Mesa Research Facility.</div>
      <div>"{this.props.motto}"</div>
      <div>{this.state.status}</div>
    );
  }
}

```


# API Documentation

Both connect functions expect a StateHandler dictionary of ezFlux-state namespaces mapping to event handler functions.
If the specified namespace changes, the handler will be called with the namespace object.  
Values returned from statehandlers will be assigned to the component.  

```TS
type StateHandlers = {
  [stateKey: string]: (state: Object, componentData: Object) => Object | void
};
```

### connectClass

All documented mehtods will be added to ezFlux.plugins.  

Handlers will be called with the namespace object and the current props given by the parent.  
Values returned from statehandlers will be Object.assigned to the props.
Returns the connected Component.

**parameters**
-   `ezFlux` **typeof EZFlux**
-   `Component` **Function**
-   `stateHandlers` **StateHandlers**

Returns **Function**


### connectInstance

Handlers will be called with the namespace object and the current component state.  
Values returned from state handlers will be assigned to the component state through instance.setState().  

**parameters**
-   `ezFlux` **typeof EZFlux**
-   `Component` **Object**
-   `stateHandlers` **StateHandlers**

Returns **void**

### connect

Will hands its arguments to connectClass or connectInstance depending on the type of Component

**parameters**
-   `ezFlux` **typeof EZFlux**
-   `Component` **Object | Function**
-   `stateHandlers` **StateHandlers**

Returns **void | Function**

# Contributing

Contributions of any kind are always welcome.  
With further simplification and performance optimization being top priority, features additions should be the absolute exception.


To run Linter, Flow, Bable and Jest and have them watch src and test folders respectively:
```sh
$ npm start
```

To run Babel once:
```sh
$ npm run build
```
To autofix eslint issues

```sh
$ npm eslint:fix
```
To generate test coverage report:

```sh
$ npm run test:coverage
```
