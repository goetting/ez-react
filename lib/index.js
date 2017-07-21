'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint-disable no-return-assign, react/sort-comp */


exports.normaliseHandler = normaliseHandler;
exports.default = createConnector;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

function normaliseHandler(handler) {
  if (typeof handler === 'function') return handler;
  if (Array.isArray(handler)) {
    return function (store) {
      return handler.reduce(function (acc, k) {
        acc[k] = store[k];return acc;
      }, {});
    };
  }
  throw new Error(handlerErr);
}

function createConnector(stores) {
  return function connect(Component, handlers) {
    if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
    if (!handlers || (typeof handlers === 'undefined' ? 'undefined' : _typeof(handlers)) !== 'object') throw new Error(handlerErr);

    var storeHandlers = Object.keys(handlers).filter(function (k) {
      if (!stores[k]) throw new Error('store "' + k + '" not found');return true;
    }).map(function (k) {
      return { handler: normaliseHandler(handlers[k]), store: stores[k] };
    });

    return function (_React$PureComponent) {
      _inherits(EZWrapper, _React$PureComponent);

      function EZWrapper(props) {
        _classCallCheck(this, EZWrapper);

        var _this = _possibleConstructorReturn(this, (EZWrapper.__proto__ || Object.getPrototypeOf(EZWrapper)).call(this, props));

        _this.state = props;
        return _this;
      }

      _createClass(EZWrapper, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
          var _this2 = this;

          this.events = storeHandlers.map(function (_ref) {
            var store = _ref.store,
                handler = _ref.handler;

            var listener = function listener() {
              var newState = handler(store, _extends({}, _this2.state));

              if (newState) _this2.setState(newState);
            };

            store.$on('change', listener);
            listener();
            return { store: store, listener: listener };
          });
        }
      }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(props) {
          this.setState(props);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this.events.forEach(function (e) {
            return e.store.$off('change', e.listener);
          });
        }
      }, {
        key: 'render',
        value: function render() {
          return _react2.default.createElement(Component, this.state);
        }
      }]);

      return EZWrapper;
    }(_react2.default.PureComponent);
  };
}