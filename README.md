# ezReact

ezReact offers a small connector to hook up React components with ezFlux stores.  
By wrapping a React component with a connect function, ezFlux state values are assigned to the component's props.  


-   [Install](#install)
-   [Usage](#usage)
    -   [Life Cycle](#life-cycle)
-   [API Documentation](#api-documentation)
    -   [createConnector](#createconnector)
    -   [connect](#connect)
-   [Contributing](#contributing)

# Install

[NPM](https://npmjs.com):

```sh
$ npm install ez-react --save
```

[Yarn](https://yarnpkg.com/):

```sh
$ yarn add ez-react
```

# Usage

First, a _connect_ function has to be created with a map of stores.  
_connect_ expects a component and an Object that maps store names to an array of state value keys.  
When the store changes, props of the connected component will update automatically.

```JS
// app.js
import { createStore } from 'ez-flux';
import createConnector from 'ez-react';

const blackMesa = createStore({
  state: { status: 'All systems are green.' },
  methods: { runExperiment: () => this.$assign({ status: 'Please stay calm.' }) },
});

export const connect = createConnector({ blackMesa });
```

```jsx
// component.js
import React from 'react';
import { connect } from './app.js';

const BlackMesa = ({ motto, status }) => (
  <div>Welcome to Black Mesa Research Facility.</div>
  <div>"{motto}"</div>
  <div>{status}</div>
);

const ConnectedBlackMesa = connect(
  BlackMesa,
  { blackMesa: ['status'] },
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
blackMesa.runExperiment();
```

... your output will automatically become:

```
Welcome to Black Mesa Research Facility.
"Working to make a better tomorrow."
Please stay calm.

```


### Life Cycle

Life Cycle of a connected Component:

- Parent will mount
- EZWraper will mount
    - Subscription to stores
    - Initial call of all connect listeners
- Connected Component Life Cycle

Please Note:
A component subscribed to a store should not trigger changes on it on construction.
Otherwise the EZWrapper will trigger a state change while rendering.
This will result in the appropriate React warnings.

# API Documentation


### createConnector

A connect function will only be able to use handlers based on the store map given to its creator.

```TS
  type CreateConnect({ [storeName: string]: Object }) => Function;
```

### connect

Will update a given component automatically when a store changes. These updates are conrolled through handlers.  
A handler may be an array of state keys or a function. If a list of state keys was passed, a handler function will be create automatically.  
An object returned by the handler will be assigned to the given component's props.  
Please Note that all handlers will be executed once _onComponentWillMount_.  

```TS
  type Component = Function;
  type Handler = (Store, props: Object) => Object | void;
  type Handlers = { [storeName: string]: string[] | Handler };

  type Connect = (Component, Handlers) => Component;
```

# Contributing

Contributions of any kind are always welcome.  
With further simplification and performance optimization being top priority, features additions should be the absolute exception.  

To run Linter, Flow, Bable and have them watch src and test folders respectively:
```sh
$ npm start
```

To run Jest --watch
```sh
$ npm run test:watch
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
