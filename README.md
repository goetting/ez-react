# ezReact (WIP)

ezReact offers a small connector to hook up React components with the ezFlux event and state system.

### Usage



ezReact.connect expects a component and an Object that maps state namespaces to event handlers.
An event handler is called after ezFlux updates the state that was specified as its key.
It will receive the updated ezFlux.state as well as the current props given from its parent.
Its return value will be assigned to the component.
Assume an ezFlux instance in app.js:

```JS
import EZFlux from 'ez-flux';

export default new EZFlux({
  blackMesa: {
    values: { status: 'All systems are green.' },
    actions: { runExperiment: () => { status: 'Please stay calm.' } },
  }
});
```

#### Connect Component Class / Function

```jsx
import React from 'react';
import { connect } from 'ez-react';
import ezFlux from './app.js';

const BlackMesa = ({ motto, status }) => (
  <div>Welcome to Black Mesa Research Facility.</div>
  <div>"{motto}"</div>
  <div>{status}</div>
);

const ConnectedBlackMesa = connect(
  ezFlux,
  BlackMesa,
  { blackMesa: (values, props) => values },
);

export default ConnectedBlackMesa;
```

After mounting the component initially:

```JS
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

```JS
import React from 'react';
import { connect } from 'ez-react';
import ezFlux from './app.js';


class BlackMesa extends React.Component {
  constructor(props) {
    super(props);
    connect(ezFlux, this, { blackMesa: values => values });
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

### Development

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
