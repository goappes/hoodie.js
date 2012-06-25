// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('hoodie/account', function() {
  var Account;
  return Account = (function() {

    Account.prototype.username = void 0;

    function Account(hoodie) {
      this.hoodie = hoodie;
      this._handle_sign_out = __bind(this._handle_sign_out, this);

      this._handle_sign_in = __bind(this._handle_sign_in, this);

      this.authenticate = __bind(this.authenticate, this);

      this.username = this.hoodie.config.get('_account.username');
      this.on('signed_in', this._handle_sign_in);
      this.on('signed_out', this._handle_sign_out);
    }

    Account.prototype.authenticate = function() {
      var defer,
        _this = this;
      defer = this.hoodie.defer();
      if (!this.username) {
        return defer.reject().promise();
      }
      if (this._authenticated === true) {
        return defer.resolve(this.username).promise();
      }
      if (this._authenticated === false) {
        return defer.reject().promise();
      }
      this._auth_request = this.hoodie.request('GET', "/_session");
      this._auth_request.done(function(response) {
        if (response.userCtx.name) {
          _this._authenticated = true;
          _this.username = response.userCtx.name;
          return defer.resolve(_this.username);
        } else {
          _this._authenticated = false;
          delete _this.username;
          _this.hoodie.trigger('account:error:unauthenticated');
          return defer.reject();
        }
      });
      this._auth_request.fail(function(xhr) {
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch (e) {
          error = {
            error: xhr.responseText || "unknown"
          };
        }
        return defer.reject(error);
      });
      return defer.promise();
    };

    Account.prototype.sign_up = function(username, password) {
      var data, defer, handle_succes, key, request_promise,
        _this = this;
      if (password == null) {
        password = '';
      }
      defer = this.hoodie.defer();
      key = "" + this._prefix + ":" + username;
      data = {
        _id: key,
        name: username,
        type: 'user',
        roles: [],
        password: password
      };
      request_promise = this.hoodie.request('PUT', "/_users/" + (encodeURIComponent(key)), {
        data: JSON.stringify(data),
        contentType: 'application/json'
      });
      handle_succes = function(response) {
        _this.hoodie.trigger('account:signed_up', username);
        _this._doc._rev = response.rev;
        return _this.sign_in(username, password).then(defer.resolve, defer.reject);
      };
      request_promise.then(handle_succes, defer.reject);
      return defer.promise();
    };

    Account.prototype.sign_in = function(username, password) {
      var defer, handle_succes, request_promise,
        _this = this;
      if (password == null) {
        password = '';
      }
      defer = this.hoodie.defer();
      request_promise = this.hoodie.request('POST', '/_session', {
        data: {
          name: username,
          password: password
        }
      });
      handle_succes = function(response) {
        _this.hoodie.trigger('account:signed_in', username);
        _this.fetch();
        return defer.resolve(username, response);
      };
      request_promise.then(handle_succes, defer.reject);
      return defer.promise();
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      var data, defer, key,
        _this = this;
      if (current_password == null) {
        current_password = '';
      }
      defer = this.hoodie.defer();
      if (!this.username) {
        defer.reject({
          error: "unauthenticated",
          reason: "not logged in"
        });
        return defer.promise();
      }
      key = "" + this._prefix + ":" + this.username;
      data = $.extend({}, this._doc);
      delete data.salt;
      delete data.password_sha;
      data.password = new_password;
      return this.hoodie.request('PUT', "/_users/" + (encodeURIComponent(key)), {
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function(response) {
          _this.fetch();
          return defer.resolve();
        },
        error: function(xhr) {
          var error;
          try {
            error = JSON.parse(xhr.responseText);
          } catch (e) {
            error = {
              error: xhr.responseText || "unknown"
            };
          }
          return defer.reject(error);
        }
      });
    };

    Account.prototype.sign_out = function() {
      var _this = this;
      return this.hoodie.request('DELETE', '/_session', {
        success: function() {
          return _this.hoodie.trigger('account:signed_out');
        }
      });
    };

    Account.prototype.logout = Account.prototype.sign_out;

    Account.prototype.on = function(event, cb) {
      return this.hoodie.on("account:" + event, cb);
    };

    Account.prototype.db = function() {
      var _ref;
      return (_ref = this.username) != null ? _ref.toLowerCase().replace(/@/, "$").replace(/\./g, "_") : void 0;
    };

    Account.prototype.fetch = function() {
      var defer, key,
        _this = this;
      defer = this.hoodie.defer();
      if (!this.username) {
        defer.reject({
          error: "unauthenticated",
          reason: "not logged in"
        });
        return defer.promise();
      }
      key = "" + this._prefix + ":" + this.username;
      this.hoodie.request('GET', "/_users/" + (encodeURIComponent(key)), {
        success: function(response) {
          _this._doc = response;
          return defer.resolve(response);
        },
        error: function(xhr) {
          var error;
          try {
            error = JSON.parse(xhr.responseText);
          } catch (e) {
            error = {
              error: xhr.responseText || "unknown"
            };
          }
          return defer.reject(error);
        }
      });
      return defer.promise();
    };

    Account.prototype.destroy = function() {
      var _this = this;
      return this.fetch().pipe(function() {
        var key;
        key = "" + _this._prefix + ":" + _this.username;
        return _this.hoodie.request('DELETE', "/_users/" + (encodeURIComponent(key)) + "?rev=" + _this._doc._rev);
      });
    };

    Account.prototype._prefix = 'org.couchdb.user';

    Account.prototype._doc = {};

    Account.prototype._handle_sign_in = function(username) {
      this.username = username;
      this.hoodie.config.set('_account.username', this.username);
      return this._authenticated = true;
    };

    Account.prototype._handle_sign_out = function() {
      delete this.username;
      this.hoodie.config.remove('_account.username');
      return this._authenticated = false;
    };

    return Account;

  })();
});
