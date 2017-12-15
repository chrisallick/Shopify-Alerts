require('dotenv').config();

const fetch = require("node-fetch");
const shopify = require("shopify-buy");
const express = require('express');
const app = express();

const client = require('twilio')(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET);

const shopifyclient = shopify.buildClient({
	storefrontAccessToken: process.env.SHOPIFY_TOKEN,
	domain: process.env.SHOPIFY_DOMAIN
}, fetch);

function checkSoldOut() {
	if( total_product_types_available == 0 ) {
		console.log("we are sold out of everything");

		client.messages.create({
			from: process.env.TWILIO_FROM,
			to: process.env.TWILIO_TO,
			body: "the store is sold out"
		}).then((messsage) => console.log(message.sid));
	}
}

var total_product_types;
var total_product_types_available;
var bNotSoldOut;
var start_time;
app.get('/', (req, res) => {
	start_time = (new Date()).getTime();
	bNotSoldOut = false;
	shopifyclient.product.fetchAll().then((products) => {
		total_product_types = products.length;
		total_product_types_available = 0;
		var current = 0;
		for(var i = 0; i < products.length; i++ ) {
			shopifyclient.product.fetch(products[i].id).then((product) => {
				if( product.variants[0].available) {
					total_product_types_available++;
					if( !bNotSoldOut ) {
						console.log( (new Date()).getTime() - start_time ); // averaging around 700ms (min = 500ms, max = 1800ms)
						bNotSoldOut = true;
						console.log("we are not sold out!"); // this will happen once
					}
				}

				current++;
				if( current == total_product_types ) {
					checkSoldOut();
				}
			});
		}
	});

	res.send('Checking if store is sold out...');
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
