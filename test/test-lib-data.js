import EZFlux from 'ez-flux';
import React from 'react';
import ezReact from '../src/index.js';

export const getTestState = () => ({
  blackMesa: {
    values: { contaminated: false, freeman: false, marinesSent: false, scientists: true },
    actions: {
      startExperiment: data => ({ contaminated: true, freeman: true }),
      contain: data => ({ marinesSent: true, scientists: false }),
    }
  }
});
export const testHandler = { blackMesa: state => state };
export const makeTestBunker = (constrctorCB = () => {}) => {
  return class TestBunker extends React.Component {
    constructor(props) {
      super(props);
      this.state = {};
      constrctorCB(this);
    }
    componentDidMount() {
      //if (!(this instanceof TestBunker)) throw new Error('componentDidMount lost Scope');
    }
    componentWillUnmount() {
      //if (!(this instanceof TestBunker)) throw new Error('componentDidMount lost Scope');
    }
    render() {
      const { name } = this.props;
      const contaminated = this.props.contaminated || this.state.contaminated;
      const scientists = this.props.scientists || this.state.scientists;
      const marinesSent = this.props.marinesSent || this.state.marinesSent;

      return (
        <div id="test-bunker">
          Base: {name}
          <ul>
            <li>Status: {contaminated ? 'Contaminated' : 'OK'}</li>
            <li>Science Personell: {scientists ? 'Unknown' : 'OK'}</li>
            <li>Security Status: {marinesSent ? 'Please stay calm.' : 'OK'}</li>
          </ul>
        </div>
      );
    }
  }
}
export const TestBunker = makeTestBunker();
export const makeEz = () => new EZFlux(getTestState());
export const tryCatch = (fn) => { try { fn() } catch(e) { return e } };