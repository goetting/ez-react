'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = ezReact;

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
var getBadStateMsg = function getBadStateMsg(name) {
  return 'key "' + name + '" not found on state of ezFlux instance';
};
var isObj = function isObj(obj) {
  return !!obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
};
var isFn = function isFn(fn) {
  return typeof fn === 'function';
};

function ezReact() {
  var _this = this;

  var createHandler = function createHandler(keys) {
    return function (state) {
      var newState = {};
      for (var i = keys.length; i--;) {
        newState[keys[i]] = state[keys[i]];
      }return newState;
    };
  };
  var removeListeners = function removeListeners(handlers) {
    for (var i = handlers.length; i--;) {
      _this.off(handlers[i].name, handlers[i].fn);
    }
  };
  var addListeners = function addListeners(instance, handlers) {
    var activeHandlers = [];
    var names = Object.keys(handlers);

    var _loop = function _loop(i) {
      var name = names[i];
      var eventName = _ezFlux2.default.getEventNames(name).change;
      var handlerVal = handlers[name];
      var stateHandler = typeof handlerVal === 'function' ? handlerVal : createHandler(handlerVal);
      var fn = function fn() {
        if (instance.willUnmount) return;
        var stateScope = _this.state[name];
        var newState = stateHandler(stateScope, instance.state);
        if (newState) instance.setState(newState);
      };
      activeHandlers.push({ name: eventName, fn: fn });
      _this.on(eventName, fn);
    };

    for (var i = names.length; i--;) {
      _loop(i);
    }
    return activeHandlers;
  };
  var validateArguments = function validateArguments(component, handlers) {
    if (!isObj(component) && !isFn(component)) throw new Error(badComponentMsg);
    if (!isObj(handlers)) throw new Error(badHandlersMsg);

    var names = Object.keys(handlers);
    var state = _this.state;

    for (var i = names.length; i--;) {
      var _name = names[i];
      if (!isFn(handlers[_name]) && !Array.isArray(handlers[_name])) throw new Error(badHandlersMsg);
      if (!state[_name]) throw new Error(getBadStateMsg(_name));
    }
  };

  return {
    connect: function connect(component, handlers, initProps) {
      if (isFn(component)) return _this.plugins.connectClass(component, handlers, initProps);
      return _this.plugins.connectInstance(component, handlers);
    },
    connectClass: function connectClass(Component, handlers, initProps) {
      validateArguments(Component, handlers);

      return function (_React$Component) {
        _inherits(EZWrapper, _React$Component);

        function EZWrapper(props) {
          _classCallCheck(this, EZWrapper);

          var _this2 = _possibleConstructorReturn(this, (EZWrapper.__proto__ || Object.getPrototypeOf(EZWrapper)).call(this, props));

          _this2.activeHandlers = [];
          _this2.willUnmount = false;
          _this2.state = {};


          if (initProps) _this2.state = initProps;
          return _this2;
        }

        _createClass(EZWrapper, [{
          key: 'componentDidMount',
          value: function componentDidMount() {
            this.activeHandlers = addListeners(this, handlers);
          }
        }, {
          key: 'componentWillUnmount',
          value: function componentWillUnmount() {
            this.willUnmount = true;
            removeListeners(this.activeHandlers);
          }
        }, {
          key: 'render',
          value: function render() {
            var childProps = Object.assign({}, this.props, this.state);

            return _react2.default.createElement(Component, childProps, this.props.children);
          }
        }]);

        return EZWrapper;
      }(_react2.default.Component);
    },
    connectInstance: function connectInstance(instance, handlers) {
      validateArguments(instance, handlers);

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
  };
}