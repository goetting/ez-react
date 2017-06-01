'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createConnector;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* es-lint-disable no-return-assign */


var handlerErr = '2nd arg must be an object mapping state keys to eventHandlers';

function normalise(handler) {
  if (typeof handler === 'function') return handler;
  if (Array.isArray(handler)) return function (store) {
    return handler.reduce(function (acc, k) {
      return acc[k] = store[k];
    }, {});
  };
  throw new Error(handlerErr);
}

function createConnector(stores) {
  return function (Component, handlers) {
    var initProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return function (_React$PureComponent) {
      _inherits(EZWrapper, _React$PureComponent);

      function EZWrapper() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, EZWrapper);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = EZWrapper.__proto__ || Object.getPrototypeOf(EZWrapper)).call.apply(_ref, [this].concat(args))), _this), _this.isMounted = true, _this.state = initProps, _temp), _possibleConstructorReturn(_this, _ret);
      }

      _createClass(EZWrapper, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
          var _this2 = this;

          if (typeof Component !== 'function') throw new Error('1st arg must be a React Component');
          if ((typeof handlers === 'undefined' ? 'undefined' : _typeof(handlers)) !== 'object') throw new Error(handlerErr);

          this.events = Object.keys(handlers).map(function (name) {
            if (!stores[name]) throw new Error('store "' + name + '" unknown to this connector');

            var stateHandler = normalise(handlers[name]);
            var store = stores[name];
            var fn = function fn() {
              if (!_this2.isMounted) return;
              var newState = stateHandler(store, _this2.state);

              if (newState) _this2.setState(newState);
            };

            store.$on('change', fn);
            return { name: name, fn: fn };
          });

          if (!this.events.length) throw new Error(handlerErr);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this.isMounted = false;
          this.events.forEach(function (e) {
            return stores[e.name].$off('change', e.fn);
          });
        }
      }, {
        key: 'render',
        value: function render() {
          return _react2.default.createElement(Component, _extends({}, this.props, this.state));
        }
      }]);

      return EZWrapper;
    }(_react2.default.PureComponent);
  };
}