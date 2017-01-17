//Base Setup
//Call required packages
var express = require('express'); //call express
var request = require('request'); //call request

var app = express(); //define app using express

//get Google Api Key
var apiKey = process.env.GOOGLE_KEY;

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
	//if no address parameter, don't send query
	if (!req.query.address) {
		res.json({message: "400 Invalid request. Invalid 'address' parameter."})
	}
	else {
		//send query with request module
		var reqStr = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.address + '&key=' + apiKey;
		request.get(reqStr, function (error, response, body) {
			if (error) {
				res.send(error);
			}
			else if (response.statusCode == 200) {
				//check if any results were found; if not, display "no content" message
				if (JSON.parse(body).results.length > 0) {
					res.json(JSON.parse(body));
				}
				else {
					res.json({message: '204: No content found for that address'});
				}
		    }
			else {
				//catch any errors that were not caught by if (error)
				res.json(response.statusCode + ' ' + JSON.parse(body).error_message);
			}
		});
	}
});

//routes that end in /timezone (requests to Timezone service)
router.route('/timezone')

//note that this works even if no timestamp parameter is provided; if no timestamp provided, defaults to current time
//geocode address to get location
.get(function(req, res) {
	//if no address or timestamp parameter, don't send query
	if (!req.query.address) {
		res.json({message: "400 Invalid request. Invalid 'address' parameter."})
	}
	else if (!req.query.timestamp) {
		res.json({message: "400 Invalid request. Invalid 'timestamp' parameter."})
	}
	else {
		//send Geocode query
		var reqStr = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.address + '&key=' + apiKey;
		request.get(reqStr, function (error, response, body) {
			if (error) {
				res.send(error);
			}
			else if (response.statusCode == 200) {
				//check if any results were found; if not, display "no content" message
				if (JSON.parse(body).results.length > 0) {
					//retrieve location information from Geocode call
					var loc = JSON.parse(body).results[0].geometry.location;
					
					//send Timezone query
					var reqStr = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + loc.lat + ',' + loc.lng + '&timestamp=' + req.query.timestamp + '&key=' + apiKey;
					request.get(reqStr, function (error, response, body) {
						if (error) {
							res.send(error);
						}
						else if (response.statusCode == 200) {
							//Timezone does not have results array; no need to check if results is empty
							res.json(JSON.parse(body));
					    }
						else {
							//catch any errors that were not caught by if (error)
							//note that Timezone uses errorMessage instead of Geocode's error_message
							res.json(response.statusCode + ' ' + JSON.parse(body).errorMessage);
						}
					});
					
				}
				else {
					res.json({message: '204: No content found for that address'});
				}
		    }
			else {
				//catch any errors that were not caught by if (error)
				res.json(response.statusCode + ' ' + JSON.parse(body).error_message);
			}
		});
	}
});

//Register the routes
//all routes will be prefixed with /api
app.use('/api', router);

//Start the server
app.listen(port);
console.log('Running on port ' + port);
