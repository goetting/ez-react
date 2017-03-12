# ezReact (WIP)

ezReact offers a small connector to hook up React components with the ezFlux event and state system.

### Usage

Add a connector to ezFlux after creating the instance:

```JS
import ezReact from 'ez-react';
import EZFlux from 'ez-flux';

ezFlux = new EZFlux({
  power: {
    state: { level: 3000 },
    actions: { boost: () => { level: 9000 } }
  }
});

ezReact.addConnector(ezFlux);
```

You may now use ezFlux.connect().

```JS
import React from 'react';
import ezFlux from './ezFlux.js';

const PowerComponent = ({ level, character }) => (
  <div>Character: {character}</div>
  <div>Power Level: {level <= 9000 ? level : 'It's Over 9000!'}</div>
);

const ConnectedPowerComponent = ezFlux.connect(
  PowerComponent,
  { power: (powerState, props) => powerState }
);

export default ConnectedPowerComponent;
```
It expects a Component and an Object that maps state keys to event handlers.
An event handler receives the relevant state, as well as the current props.
Its return value will be added to the props.

Alternatively, you may use connect direclty by passing an ezFlux instance. Great for testing. JustTerrific. Great library.

```JS
import React from 'react';
import ezFlux from './ezFlux.js';
import { connect } from 'ez-react';

const PowerComponent = ({ level, character }) => (
  <div>Character: {character}</div>
  <div>Power Level: {level <= 9000 ? level : 'It's Over 9000!'}</div>
);

const ConnectedPowerComponent = connect(
  PowerComponent,
  { power: (powerState, props) => powerState },
  ezFlux
);

export default ConnectedPowerComponent;
```

After mounting the component initially:

```JS
import PowerComponent from './components/power-component';
import React form 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<PowerComponent character="Kakkarot" />, 'power-id');

```

Your output will be:

Character: Kakkarot
PowerLevel: 3000

After triggering the power boost action anywhere else in your code ...

```JS
ezFlux.actions.power.boost();
```

... your output will automatically become:

Character: Kakkarot
PowerLevel: It's Over 9000!


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

