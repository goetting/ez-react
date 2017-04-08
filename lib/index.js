'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.plugins = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.connect = connect;
exports.connectInstance = connectInstance;
exports.connectClass = connectClass;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ezFlux = require('ez-flux');

var _ezFlux2 = _interopRequireDefault(_ezFlux);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var badHandlersMsg = '3rd arg must be an object mapping state keys to eventHandlers';
var badComponentMsg = '2nd arg must be a React Component class or instance';
var badEzFluxMsg = 'ezReact functions must be plugged into EZFlux instance';
var getBadStateMsg = function getBadStateMsg(name) {
  return 'key "' + name + '" not found on state of ezFlux instance';
};
var isObj = function isObj(obj) {
  return !!obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
};

function addListeners(instance, handlers, ezFlux) {
  var activeHandlers = [];
  var names = Object.keys(handlers);

  var _loop = function _loop(i) {
    var name = names[i];
    var eventName = _ezFlux2.default.getEventNames(name).change;
    var fn = function fn() {
      if (instance.willUnmount) return;
      var stateScope = ezFlux.state[name];
      var newState = handlers[name](stateScope, instance.state);
      if (newState && (typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) === 'object') instance.setState(newState);
    };
    activeHandlers.push({ name: eventName, fn: fn });
    ezFlux.on(eventName, fn);
  };

  for (var i = names.length; i--;) {
    _loop(i);
  }
  return activeHandlers;
}

function removeListeners(handlers, ezFlux) {
  for (var i = handlers.length; i--;) {
    ezFlux.off(handlers[i].name, handlers[i].fn);
  }
}

function validateArguments(ezFlux, component, handlers) {
  if (!(ezFlux instanceof _ezFlux2.default)) throw new Error(badEzFluxMsg);
  if (!isObj(component) && typeof component !== 'function') throw new Error(badComponentMsg);
  if (!isObj(handlers)) throw new Error(badHandlersMsg);

  var names = Object.keys(handlers);
  var state = ezFlux.state;

  for (var i = names.length; i--;) {
    if (typeof handlers[names[i]] !== 'function') throw new Error(badHandlersMsg);
    if (!state[names[i]]) throw new Error(getBadStateMsg(names[i]));
  }
}

function connect(component, handlers) {
  if (typeof component === 'function') return this.plugins.connectClass(component, handlers);
  return this.plugins.connectInstance(component, handlers);
}

function connectInstance(instance, handlers) {
  var _this = this;

  validateArguments(this, instance, handlers);
  var componentDidMount = instance.componentDidMount,
      componentWillUnmount = instance.componentWillUnmount;

  var activeHandlers = [];

  instance.willUnmount = false;

  instance.componentDidMount = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    activeHandlers = addListeners(instance, handlers, _this);
    if (componentDidMount) componentDidMount.apply(instance, args);
  };

  instance.componentWillUnmount = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    instance.willUnmount = true;
    removeListeners(activeHandlers, _this);
    if (componentWillUnmount) componentWillUnmount.apply(instance, args);
  };
}

function connectClass(Component, handlers) {
  var ezFlux = this;

  validateArguments(ezFlux, Component, handlers);

  return function (_React$PureComponent) {
    _inherits(EZWrapper, _React$PureComponent);

    function EZWrapper() {
      var _ref;

      var _temp, _this2, _ret2;

      _classCallCheck(this, EZWrapper);

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _ret2 = (_temp = (_this2 = _possibleConstructorReturn(this, (_ref = EZWrapper.__proto__ || Object.getPrototypeOf(EZWrapper)).call.apply(_ref, [this].concat(args))), _this2), _this2.activeHandlers = [], _this2.willUnmount = false, _this2.state = {}, _temp), _possibleConstructorReturn(_this2, _ret2);
    }

    _createClass(EZWrapper, [{
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.activeHandlers = addListeners(this, handlers, ezFlux);
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.willUnmount = true;
        removeListeners(this.activeHandlers, ezFlux);
      }
    }, {
      key: 'render',
      value: function render() {
        var childProps = Object.assign({}, this.props, this.state);

        return _react2.default.createElement(Component, childProps, this.props.children);
      }
    }]);

    return EZWrapper;
  }(_react2.default.PureComponent);
}

var plugins = exports.plugins = [connect, connectClass, connectInstance];

exports.default = {
  plugins: plugins,
  connect: connect,
  connectClass: connectClass,
  connectInstance: connectInstance
};