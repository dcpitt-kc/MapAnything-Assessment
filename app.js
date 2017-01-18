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
		res.status(400);
		res.json({message: "Invalid request. Invalid 'address' parameter."});
	}
	else {
		//send query with request module
		var reqStr = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.address + '&key=' + apiKey;
		request.get(reqStr, function (error, response, body) {
			if (error) {
				res.status(response.statusCode);
				res.send(error);
			}
			else {
				//check if any results were found; if not, display "no content" message
				resBody = JSON.parse(body);
				if (resBody.results.length > 0) {
					res.status(response.statusCode);
					res.json(resBody);
				}
				else {
					res.status(204);
					res.json(resBody);
				}
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
		res.status(400);
		res.json({message: "Invalid request. Invalid 'address' parameter."});
	}
	else if (!req.query.timestamp) {
		res.status(400);
		res.json({message: "Invalid request. Invalid 'timestamp' parameter."});
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
				resBody = JSON.parse(body);
				if (resBody.results.length > 0) {
					//retrieve location information from Geocode call
					var loc = resBody.results[0].geometry.location;
					
					//send Timezone query
					var reqStr = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + loc.lat + ',' + loc.lng + '&timestamp=' + req.query.timestamp + '&key=' + apiKey;
					request.get(reqStr, function (error, response, body) {
						if (error) {
							res.status(response.statusCode);
							res.send(error);
						}
						else {
							//Timezone does not have results array; no need to check if results is empty
							res.status(response.statusCode);
							res.json(JSON.parse(body));
					    }
					});
					
				}
				else {
					res.status(204);
					res.json(resBody);
				}
		    }
			else {
				//catch anything that isn't an error or a 200
				res.status(response.statusCode);
				res.json(JSON.parse(body));
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
