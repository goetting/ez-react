/* @flow *//* eslint-disable react/sort-comp */
import { createStore } from 'ez-flux';
import React from 'react';

export class TestBunker extends React.Component<Object, Object> {
  state = {};
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
export const makeStore = () => createStore({
  state: { contaminated: false, freeman: false, marinesSent: false, scientists: true },
  methods: {
    startExperiment() { this.$assign({ contaminated: true, freeman: true }); },
    contain() { this.$assign({ marinesSent: true, scientists: false }); },
  },
});
export const testHandler = { blackMesa: (store: Object): Object => store.$copy() };
