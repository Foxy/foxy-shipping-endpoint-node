# Foxy Custom Shipping Endpoint for Node.js

This is a Node.js helper module for creating custom shipping rates for the FoxyCart Custom Shipping Endpoint functionality added in version 2.0

## Example Usage

FoxyCart POSTs to your endpoint script a JSON payload containing information about the customers cart and address. Here is an example of a simple endpoint using the FoxyShippingResponse module, `express` for route management and `body-parser` for handling the incoming JSON payload:

```js
var express = require('express');
var ShippingResponse = require('foxy-shipping-response');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(request, response) {
  var cart_details = request.body;
  rates = new ShippingResponse(cart_details);

  rates.add(10001, 5, "FoxyPost", "Standard");
  rates.add(10002, 15.50, "FoxyPost", "Express");
  
  response.setHeader('Content-Type', 'application/json');
  response.send(rates.output());
});

app.listen(6000);
```

#### Payload

For an example of the payload that is sent to your endpoint, please refer to the [example on the FoxyCart wiki](https://wiki.foxycart.com/v/2.0/shipping#custom_shipping_endpoint).

## Installation

```
$ npm install foxy-shipping-response
```

## Requirements

* Node.js >= 0.10 (>= 4.0 recommended)
* Some sort of framework for routing requests - such as express.js

## Getting Started

To start creating your custom rates, you first need to create the Shipping Response object. The requires that you've included the `foxy-shipping-response` module in your script, and you pass the JSON object of the cart data payload your endpoint received when creating the object:

```js
var ShippingResponse = require('foxy-shipping-response');
// capture request body into variable named cart_details
rates = new ShippingResponse(cart_details);
```

### Helper Functions

The `foxy-shipping-response` module adds a number of functions you can utilise to execute your custom shipping logic:

#### `add()`

Adds an additional shipping option to the checkout.

##### Parameters:

* `service_id` _(Number)_ - Minimum of 10000. Can not be the same as another rate
* `price` _(Number)_ - A number to two decimal places
* `method` _(String)_
* `service_name` _(String)_
* `add_flat_rate` _(Boolean)_ - Optional, default: `true` - If true, any applicable flat rates will be added onto the price of this rate
* `add_handling` _(Boolean)_ - Optional, default: `true` - If true, any applicable handling fees will be added onto the price of this rate

##### Example:

```js
rates.add(10001, 5, 'FoxyPost', 'Standard');
rates.add(10002, 0, null, 'Free Shipping', false, false);
```

##### Notes:
 * If the `service_id` provided is less than 10000, the provided rate will be added to it (eg: if 125 is provided as the `service_id`, the resulting id will actually be 10125).
 * Make sure that the `service_id` you use doesn't duplicate a id for an existing rate. 
 * You don't have to provide both the carrier and the service parameters - but at least one of them is required.

#### `hide()`

Hides one or many existing shipping options.

##### Parameters:

* `selector` _(Number, String or Array)_ - Can be the service id of a rate, a string containing the carrier or the service (or a combination of) or an array of service ids.

##### Example:
```js
rates.hide(10001);  // Will hide rate 10001
rates.hide('all');  // Will hide all rates
rates.hide('FedEx');  // Will hide all rates for FedEx
rates.hide('Overnight');  // Will hide all rates with a service name that contains 'Overnight'
rates.hide('USPS Express');  // Will hide any rates from USPS that contain the word 'Express'
rates.hide([10001,10005,10007]);  // Will hide rates with codes 10001, 10005 and 10007
```

##### Notes: 
 * Any rates that are still hidden at the end of the custom logic block will be removed and not passed back to the checkout in the response.

#### `show()`

Shows one or many existing shipping options that have previously been hidden.

##### Parameters:

* `selector` _(Number, String or Array)_ - Can be the service id of a rate, a string containing the carrier or the service (or a combination of) or an array of service ids.

##### Example:

```js
rates.show(10001);  // Will show rate 10001
rates.show('all');  // Will show all rates
rates.show('FedEx');  // Will show all rates for FedEx
rates.show('Overnight');  // Will show all rates with a service name that contains 'Overnight'
rates.show('USPS Express');  // Will show any rates from USPS that contain the word 'Express'
rates.show([10001,10005,10007]);  // Will show rates with codes 10001, 10005 and 10007
```

#### `update()`

Updates one or many existing shipping options.

##### Parameters:

* `selector` _(Number, String or Array)_ - Can be the service id of a rate, a string containing the carrier or the service (or a combination of) or an array of service ids.
* `modifier` _(String or Number)_ - Can either be a number (which sets the price to match) or a string containing the operator and a number eg `+20` , `-10` , `*2` , `/2.5` , `=15` . You can also append the string with a `%` sign to make the operation based on a percentage, eg `+20%` - add 20%, `-20%` - less 20%, `/20%` - divide by 20%, `*20%` - multiply by 20%.
* `method` _(String)_ - Optional, if provided replaces the current method
* `service_name` _(String)_ - Optional, if provided replaces the current service name

##### Examples:

```js
rates.update(10001, 5);  // Will set rate 1 to be $5
rates.update('all', '*2');  // Will set all current rates to double their current cost
rates.update('FedEx', '+5');  // Will set all rates for FedEx to be $5 more than what they are currently
rates.update('Overnight', '-5');  // Will set all rates with a service name that contains 'Overnight' to be $5 less than currently set
rates.update('USPS Express', '=6');  // Will set any rates from USPS that contain the word 'Express' to be $6
rates.update([10001,10005,10007], '/2');  // Will set rates with codes 10001, 10005 and 10007 to be half their current cost
rates.update('USPS', '+20%');  // Will add 20% of the current rate to each of the USPS rates
rates.update('USPS Ground', null, null, 'Super Saver');  // Will change “USPS Ground” to be called “USPS Super Saver”
```

#### `reset()`

Resets the shipping results to be empty and clears out any error message.

##### Example:

```js
rates.reset();
```

#### `error()`

Set an error response for the rates. If both an error message and valid shipping rates are present, the error message will take precendence.

##### Parameters:

* `message` _(String)_ - If not passed, any existing error message will be cleared

##### Example:

```js
rates.error("Sorry, we can't ship to Canada");
```

#### `output()`

Returns the current rates or error message as a JSON encoded string

##### Parameters:

* `output_as_string` _(Boolean)_  - Optional, default: `true` - If true, the output will be passed through `JSON.stringify()` to return the JSON object as a string.

##### Example:

```js
response.send(rates.output());
```

## Code Examples

The following are examples of the custom logic for common shipping requirements. They all assume a basic endpoint with the following code, including the `foxy-shipping-response`, `express` and `body-parser` modules:

```js
var express = require('express');
var ShippingResponse = require('foxy-shipping-response');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(request, response) {
  var cart_details = request.body;
  rates = new ShippingResponse(cart_details);

  // Custom logic pasted here
  
  response.setHeader('Content-Type', 'application/json');
  response.send(rates.output());
});

app.listen(6000);
```


#### Example 1 - Conditional free shipping

* Free shipping if the customer orders $40 or more, otherwise it's $5 flat rate

```js
rates.add(10001, 5, 'FoxyPost', 'Standard');
if (cart_details['_embedded']['fx:shipment']['total_item_price'] >= 40) {
  rates.update(10001, 0);
}
```

#### Example 2 - Adjust rates based on weight and item count

* 3 default shipping options: standard, priority and express.
* If the total weight of the cart is greater that 10, adjust the shipping costs.
* If there are more than 5 products, remove the express option.

```js
rates.add(10001, 5, 'FoxyPost', 'Standard');
rates.add(10002, 9.45, 'FoxyPost', 'Priority');
rates.add(10003, 10, 'FoxyPost', 'Express (Next Day)');
 
if (cart_details['_embedded']['fx:shipment']['total_weight'] > 10) {
  rates.update(10001, 6);
  rates.update(10002, 10);
  rates.update(10003, 11.99);
}
 
if (cart_details['_embedded']['fx:items'].length > 5) {
  rates.remove(10003);
}
```

#### Example 3 - Postage calculated based on the number of products

* Postage is calculated as a base price per product, with each subsequent product adding an additional cost.
* Two different groups of shipping options are presented, one for local delivery within the US, and one for international addresses based off of the shipping country.

```js
var item_count = cart_details['_embedded']['fx:items'].length;
if (cart_details['_embedded']['fx:shipment']['country'] == "US") {
  var postage = 10 + (($item_count - 1) * 0.50);
  rates.add(10001, postage, 'FoxyPost', 'Standard');
 
  var postage = 12 + (($item_count - 1) * 1.50);
  rates.add(10002, postage, 'FoxyPost', 'Express');
} else {
  var postage = 15 + (($item_count - 1) * 2);
  rates.add(10003, postage, 'FoxyPost', 'International');
}
```

#### Example 4 - Shipping rates based on categories

* Postage is assigned per category.
* If there is a product from CategoryA in the cart, then present express option
* If there is only a product from CategoryB in the cart, provide free shipping as an option
* Ensure that any existing flat rate and handling fees don't get added on to the free shipping option

```js
var hasCategoryA = false;
var hasCategoryB = false;
for (p in cart_details['_embedded']['fx:items']) {
  switch (cart_details['_embedded']['fx:items'][p]['_embedded']['fx:item_category']['code']) {
    case "CategoryA":
      hasCategoryA = true;
      break;
    case "CategoryB":
      hasCategoryB = true;
      break;
  }
}
if (hasCategoryB && !hasCategoryA) {
  rates.add(10001, 0, '', 'Free Ground Shipping', false, false);
} else if (hasCategoryA) {
  rates.add(10002, 5.99, 'FoxyPost', 'Express')
}
```

#### Example 5 - Free shipping based on a coupon

* Postage is flat rate, but free if “free shipping” coupon is present
* Allow free shipping only if a certain coupon code is present. In this example, one with a code of `freeshipping`.

```js
rates.add(10001, 5, "FoxyPost", "Standard");

for (d in cart_details['_embedded']['fx:discounts']) {
  if (cart_details['_embedded']['fx:discounts'][d]['code'] == "freeshipping") {
    rates.update(10001, 0);
  }
}
```

#### Example 6 - Pricing based on countries

* Pricing tiers, one for the UK, one for Europe and then the rest of the world

```js
var tier1 = ['GB'];
var tier2 = ['AL', 'AD', 'AM', 'AT', 'BY', 'BE', 'BA', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FO', 'FI', 'FR', 'GB', 'GE', 'GI', 'GR', 'HU', 'HR', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MC', 'MK', 'MT', 'NO', 'NL', 'PL', 'PT', 'RO', 'RU', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA'];
var country = cart_details['_embedded']['fx:shipment']['country'];

if (tier1.indexOf(country) > -1) {
  // United Kingdom
  rates.add(1, 10, 'FoxyPost', 'Standard');
} else if (tier2.indexOf(country) > -1) {
  // Europe
  rates.add(2, 20, 'FoxyPost', 'International');
} else {
  // Rest of world
  rates.add(3, 30, 'FoxyPost', 'International');
}
```

## License

Copyright (c) Foxy.io

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.