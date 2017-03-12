import EZFlux from 'ez-flux';
import React from 'react';
import ezReact from '../src/index.js';

export const getTestState = () => EZFlux.cloneDeep({
  blackMesa: {
    state: {
      contaminated: false,
      freeman: false,
      marinesSent: false,
      scientists: true
    },
    actions: {
      startExperiment: (data, state, set) => set({ contaminated: true, freeman: true }),
      contain: (data, state, set) => set({ marinesSent: true, scientists: false }),
      enterXen: (data, state, set) => set({ freeman: false }),
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
export const makeConnectedEZFlux = () => ezReact.addConnector(new EZFlux(getTestState()));
export const tryCatch = (fn) => { try { fn() } catch(e) { return e } };