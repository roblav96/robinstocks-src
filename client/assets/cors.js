(function () {
    if (!window.crossOriginEnabled_noConflict12348767565) {

        window.crossOriginEnabled_noConflict12348767565 = true;
        XMLHttpRequest.prototype.oldOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.oldSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.getBaseUrl = function getBaseUrl(str) {
            var base = str.split("://");
            !base[1] && (base = location.href.split("://"));    // No base = same domain
            return base[0] + "://" + base[1].substr(0, base[1].indexOf("/") + 1); //  + 1 = include the /
        };

        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            this.myBase = this.getBaseUrl(location.href);   // Can probably just use location.origin + "/"

            // Here you can use a white/black list to include/exclude domains.
            if (this.myBase !== this.getBaseUrl(url)) {
                this.crossDomainRequest = true;
                this.openParams = [method, url, async, user, password];
                return this.oldOpen.apply(this, arguments);
                // Same domain, so use original open function
            }
            this.crossDomainRequest = false;
            return this.oldOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
            this.requestHeaders || (this.requestHeaders = []);
            this.requestHeaders.push([key, value]);
            return this.oldSetRequestHeader.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (object) {
            if (!this.crossDomainRequest) {
                return this.oldSend.apply(this, arguments);
            }
            //console.log("Going Cross Domain");
            var _this = this;
            var insaneName = _this.openParams[1] + performance.now();
            _this[insaneName] = function (event) {
                if (event.source === window && event.data.id === insaneName && event.data.message === "Response") {
                    window.removeEventListener("message", _this[insaneName], false);
                    // Delete removes the read only restriction
                    var response, responseText, status, statusText, readyState;
                    Object.defineProperty(_this, 'response', {
                        get: function () { return response; },
                        set: function (newValue) { response = newValue; },
                        enumerable: true,
                        configurable: true
                    });
                    _this.response = event.data.response.xhr.response;
                    Object.defineProperty(_this, 'responseText', {
                        get: function () { return responseText; },
                        set: function (newValue) { responseText = newValue; },
                        enumerable: true,
                        configurable: true
                    });
                    _this.responseText = event.data.response.xhr.responseText;
                    Object.defineProperty(_this, 'status', {
                        get: function () { return status; },
                        set: function (newValue) { status = newValue; },
                        enumerable: true,
                        configurable: true
                    });
                    _this.status = event.data.response.xhr.status;
                    Object.defineProperty(_this, 'statusText', {
                        get: function () { return statusText; },
                        set: function (newValue) { statusText = newValue; },
                        enumerable: true,
                        configurable: true
                    });
                    _this.statusText = event.data.response.xhr.statusText;
                    Object.defineProperty(_this, 'readyState', {
                        get: function () { return readyState; },
                        set: function (newValue) { readyState = newValue; },
                        enumerable: true,
                        configurable: true
                    });
                    _this.readyState = event.data.response.xhr.readyState;
                    _this.onreadystatechange && _this.onreadystatechange();
                    event.data.response.status === "onload" && _this.onload && _this.onload();
                    event.data.response.status === "onerror" && _this.onerror && _this.onerror();
                }
            };

            window.addEventListener("message", _this[insaneName], false);
            window.postMessage({
                message: "Request",
                id: insaneName,
                request: {
                    openParams: _this.openParams,
                    headers: _this.requestHeaders || [],
                    responseType: _this.responseType,
                    object: object
                }
            }, "*");    // "*" is safe because we only communicate in the same window.

        };
    }
}());