/**
 * ShippingResponse Custom Shipping Endpoint Helper
 *
 * @author foxy.io
 * @copyright foxy.io LLC
 * @version 1.1.0
 * @license MIT http://opensource.org/licenses/MIT
 */

function ShippingResponse(cart_details) {
    if (cart_details === undefined) {
        console.log("Error: The cart JSON payload is required to be passed to the ShippingResponse object");
        return false;
    }

    this.rates = (cart_details["_embedded"].hasOwnProperty("fx:shipping_results")) ? cart_details["_embedded"]["fx:shipping_results"] : [];
    this.error_message = false;
    this.cart_details = cart_details;
}

/**
* Add a custom rate
* 
* @param int service_id
* @param float price
* @param string method
* @param string service_name
* @param boolean add_flat_rate
* @param boolean add_handling
**/
ShippingResponse.prototype.add = function(service_id, price, method, service_name, add_flat_rate, add_handling) {
    add_flat_rate = (add_flat_rate === undefined) ? true : add_flat_rate;
    add_handling = (add_flat_rate === undefined) ? true : add_handling;

    if (service_id < 10000) {
      service_id += 10000;
    }
    if (add_handling) {
      price += this.cart_details["_embedded"]["fx:shipment"]["total_handling_fee"];
    }
    if (add_flat_rate) {
      price += this.cart_details["_embedded"]["fx:shipment"]["total_flat_rate_shipping"];
    }
    this.rates.push({"method": method, "price": price, "service_id": service_id, "service_name": service_name});
};

/**
* Hide a rate that has been added
* 
* @param int|string|array selector
**/
ShippingResponse.prototype.hide = function(selector) {
    var rates = this.filterShippingOptions(selector);
    for (var i = 0; i < rates.length; i++) {
        this.rates[rates[i]].hide = true;
    }
}; 

/**
* Show a rate that has been hidden
* 
* @param int|string|array selector
**/
ShippingResponse.prototype.show = function(selector) {
    var rates = this.filterShippingOptions(selector);
    for (var i = 0; i < rates.length; i++) {
        this.rates[rates[i]].hide = false;
    }
};

/**
* Alias for hide();
* 
* @param int|string|array selector
**/
ShippingResponse.prototype.remove = function(selector) {
    this.hide(selector);
};

/**
* Update an existing rate's price, service name or method
* 
* @param int|string|array selector
* @param int|string modifier
* @param string method
* @param string service_name
**/
ShippingResponse.prototype.update = function(selector, modifier, method, service_name) {
    var rates = this.filterShippingOptions(selector);

    for (var i = 0; i < rates.length; i++) {
        if (typeof(modifier) === "number" || (typeof(modifier) === "string" && modifier !== "")) {
            var price = this.modifyPrice(this.rates[rates[i]].price, modifier);
            this.rates[rates[i]]["price"] = price;
        }

        if (typeof(method) === "string") {
            this.rates[rates[i]]["method"] = method;
        }
        if (typeof(service_name) === "string") {
            this.rates[rates[i]]["service_name"] = service_name;
        }
    }
};

/**
* Empty any existing rates and error message
* 
**/
ShippingResponse.prototype.reset = function() {
    this.rates = [];
    this.error_message = false;
};

/**
* Add an error message
* 
* @param string message
**/
ShippingResponse.prototype.error = function(message) {
    this.error_message = message;
};

/**
* Output the existing rates or error message as a JSON encoded string
* 
* @param boolean output_as_string
* @return string
**/
ShippingResponse.prototype.output = function(output_as_string) {
    output_as_string = (output_as_string === undefined) ? true : output_as_string;
    var response = {};
    if (this.error_message !== false) {
        response["ok"] = false;
        response["details"] = this.error_message;
    } else {
        var rates = this.rates.filter(function(r) {
            return (!r.hasOwnProperty("hide") || !r["hide"]);
        });
        response["ok"] = true;
        response["data"] = {
            "shipping_results": rates
        };
    }

    if (output_as_string) {
      response = JSON.stringify(response);
    }

    return response;
};
ShippingResponse.prototype.filterShippingOptions = function(selector) {
    if (typeof(selector) == "number") {
        // They've just provided a rate code
        for (var i = 0; i < this.rates.length; i++) {
            if (this.rates[i].service_id == selector) {
                return [i];
            }
        }
    } else if (typeof(selector) == "string") {
        // It's a string, must be a combination of carrier and service or all
        var rate_codes = [];
        var rates = {};
        for (var i = 0; i < this.rates.length; i++) {
            var rate = this.rates[i];

            rates[i] = rate.method + " " + rate.service_name;
        }

        if (selector.toLowerCase() != "all") {
            // Some filter has been specified
            var regex = /(fedex|usps|ups)?\s?([\w\s]+)?/i,
            provider = regex.exec(selector);

            if (provider === undefined || provider === "") return;

            for (var i in rates) {
                if (provider[1] !== undefined && provider[1] !== "") {
                    if (rates[i].toLowerCase().indexOf(provider[1].toLowerCase()) == -1) {
                        delete rates[i];
                        continue;
                    }
                }

                if (provider[2] !== undefined && provider[2] !== "") {
                    if (rates[i].toLowerCase().indexOf(provider[2].toLowerCase()) == -1) {
                        delete rates[i];
                    }
                }
            }
        }

        for (var i in rates) {
            rate_codes.push(parseInt(i));
        }

        return rate_codes;

    } else if (typeof(selector) == "object") {
        // Assume it's an array of codes
        var rate_codes = [];
        for (var i = 0; i < selector.length; i++) {
            for (var r = 0; r < this.rates.length; r++) {
                if (this.rates[r].service_id == selector[i]) {
                    rate_codes.push(r);
                }
            }
        }
        return rate_codes;
    }
};
ShippingResponse.prototype.modifyPrice = function(price, modifier) {
    var modifier = modifier.toString(),
        regex = /([\+\-\=\*\/])?(\d+(?:\.\d+)?)(%)?/,
        parts = regex.exec(modifier),
        price = parseFloat(price),
        modifyBy = parseFloat(parts[2]);

    if (parts[3] != undefined && parts[3] != "") {
        modifyBy = price * (modifyBy / 100);
    }

    var operator = (parts[1] === undefined && parts[1] !== "") ? "=" : parts[1];
    switch(operator) {
        case "+":
            price = (price + modifyBy);
        break;
        case "-":
            price = (price - modifyBy);
        break;
        case "/":
            price = (price / modifyBy);
        break;
        case "*":
            price = (price * modifyBy);
        break;
        default:
            price = modifyBy;
    }

    return (price < 0) ? 0 : price;
};

module.exports = ShippingResponse;