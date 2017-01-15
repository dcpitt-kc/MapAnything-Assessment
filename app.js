//Base Setup
//Call required packages
var express = require('express'); //call express
var maps = require('@google/maps'); //call Google maps client

var app = express(); //define app using express

//create Google maps client
var apiKey = process.env.GOOGLE_KEY
var googleMapsClient = maps.createClient({
	  key: apiKey
	});

var port = process.env.PORT || 3000 //set port

//Routes for the API
var router = express.Router(); //get instance of express Router

//middleware to use for all requests
router.use(function(req, res, next) {
	//do logging
	console.log('Request has been received');
	next(); //make sure it goes to the next route
})

//test route to make sure everything works
router.get('/', function(req, res) {
	res.json({message: 'Use /api/geocode?address=AddressParameter for geocoding service. Use /api/timezone?address=AddressParameter&timestamp=TimeStampParameter for timezone service.'});
});

//routes that end in /geocode (requests to Geocoding service)
router.route('/geocode')

//geocode the address
.get(function(req, res) {
	googleMapsClient.geocode({
		address: req.query.address
	}, function(err, response) {
		if (err) {
			res.send(err);
		}
		else if (response.status == 200){
			if (response.json.results.length > 0) { //check if any results were found
				res.json(response.json.results[0]);
			}
			else {
				res.json({message: '204: No content found for that address'});
			}
		}
		else {
			res.json(response.status + ' ' + response.json.error_message); //if an error is received, display status code and error message
		}
	});
});

//routes that end in /timezone (requests to Timezone service)
router.route('/timezone')

//note that this works even if no timestamp parameter is provided; if no timestamp provided, defaults to current time
//geocode address to get location
.get(function(req, res) {
	googleMapsClient.geocode({
		address: req.query.address
	}, function(err, response) {
		if (err) {
			res.send(err);
		}
		else if (response.status == 200) {
			if (!response.json.results.length > 0) { //check if any results were found
				res.json({message: '204: No content found for that address'});
			}
			else {
				//use location in timezone request
				var loc = response.json.results[0].geometry.location;
				googleMapsClient.timezone({
					location: loc,
					timestamp: req.query.timestamp
				}, function(err, response) {
					if (err) {
						res.send(err);
					}
					else if (response.status == 200) {
						//having timestamp= with nothing after it gets a 200 status code from the request, but only returns {"status": "INVALID_REQUEST"}; manually sets result to the same as e.g. timestamp=a
						if (response.json.status == "INVALID_REQUEST") {
							res.json("400 Invalid request. Invalid 'timestamp' parameter.");
						}
						else {
							res.json(response.json);
						}
					}
					else {
						res.json(response.status + ' ' + response.json.errorMessage); //if an error is received, display status code and error message
					}
				});
			}
		}
		else {
			res.json(response.status + ' ' + response.json.error_message); //if an error is received, display status code and error message
		}
	});
});


//Register the routes
//all routes will be prefixed with /api
app.use('/api', router);

//Start the server
app.listen(port);
console.log('Running on port ' + port);
