//Various required node packages and files
require("dotenv").config();
var Twitter = require("twitter");
var Spotify = require("node-spotify-api");
var request = require("request");
var fs = require("fs");
var apiKeys = require("./keys.js");

//first need to export an object of the keys from keys.js
var spotify = new Spotify(apiKeys.spotify);
var client = new Twitter(apiKeys.twitter);

//api call placed inside a function, so I now have a layout that goes: if X, do Y, where Y is callable, so that I can
//read a text file and then call whichever Y matches the X found in the textfile
function commandCall(command, stuff) {
    if (command === "spotify-this-song") {
        songSearch(stuff);
    } else if (command === "movie-this") {
        movieSearch(stuff);
    } else if (command === "my-tweets") {
        twitSearch(stuff);
    } else if (command === "do-what-it-says") {
        wildCard(stuff);
    } else {
        console.log("Command not recognized, try calling: " + "\n" +
            "movie-this, spotify-this-song, my-tweets, or do-what-it-says");
    }
}

//------------------------MOVIE API CALL-----------------------------------------------------
function movieSearch(params) {

    // Function which assembles the movie name and returns it
    function buildMovieTitle(input) {
        var args = ""; //initialize an arguments string that will become the fully assembled movieName passed into queryURL
        for (i = 3; i < input.length; i++) {
            if (args === "") { //if the moviename is just starting assembly, don't need to concatenate a plus sign
                args += input[i];
            } else {
                args += "+" + input[i];
            };
        }
        return args;
    };

    //build the movie title based on user input, if none provided, default to Mr. Nobody
    var movieName = buildMovieTitle(params);
    if (movieName === "") {
        movieName = "Mr.+Nobody";
        console.log("No movie title was provided, so a default was used.")
    }

    // Then run a request to the OMDB API with the movie specified
    var queryUrl = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&apikey=14a66ffa";
    //console.log(queryUrl); I know this works so commented out
    request(queryUrl, function (error, response, body) {
        // If the request is successful
        if (!error && response.statusCode === 200) {
            // Then log the Release Year for the movie
            console.log("Title: " + JSON.parse(body).Title + "\n" +
                "Year release: " + JSON.parse(body).Year + "\n" +
                "IMDB Rating: " + JSON.parse(body).Ratings[0].Value + "\n" +
                "Rotten Tomatoes Rating: " + JSON.parse(body).Ratings[1].Value + "\n" +
                "Country(ies) of Production: " + JSON.parse(body).Country + "\n" +
                "Languages: " + JSON.parse(body).Language + "\n" +
                "Plot: " + JSON.parse(body).Plot + "\n" +
                "Actors: " + JSON.parse(body).Actors);
        };
        fs.appendFile("log.txt", "\n" + "movie-this " + JSON.parse(body).Title, function (err) {
            // If the code experiences any errors it will log the error to the console.
            if (err) {
                return console.log(err);
            }
        });
    })
}
//-------------------------------END MOVIE API CALL-------------------------------------

//--------------------------TWITTER API CALL------------------------------------
function twitSearch(params) {
    client.get('statuses/user_timeline', { screen_name: 'liri_reads', count: 20 }, function (error, tweets, response) {
        //console.log(JSON.stringify(tweets));
        for (var i = 0; i < tweets.length; i++) {
            console.log(tweets[i].text, tweets[i]["created_at"])
        }
        fs.appendFile("log.txt", "\n" + "my-tweets", function (err) {
            // If the code experiences any errors it will log the error to the console.
            if (err) {
                return console.log(err);
            }
        });
    });
};
//-----------------------------------END TWITTER API CALL-----------------------------------

//-----------------------------------SPOTIFY API CALL--------------------------------
function songSearch(params) {

    //function which assemble the song title and returns it
    function buildSongTitle(input) {
        var args = ""; //initialize an arguments string that will become the fully assembled songName passed into queryURL
        for (i = 3; i < input.length; i++) {
            if (args === "") { //if the song is just starting assembly, don't need to concatenate a blank space
                args += input[i];
            } else {
                args += " " + input[i];
            };
        }
        return args;
    };

    //Build the song title, if no song is given, search using a default songName
    var songName = buildSongTitle(params);
    if (songName === "") {
        songName = "The Sign";
        console.log("No song input provided, so a default was used.")
    }

    //then pass the songName to the spotify search request
    spotify.search({ type: 'track', query: songName }, function (err, data) {
        if (err) {
            return console.log('Error occurred: ' + err);
        }
        console.log("Artist: " + data["tracks"]["items"][0].artists[0].name);
        console.log("Song title: " + data["tracks"]["items"][0].name)
        console.log("Preview link: " + data["tracks"]["items"][0].preview_url)
        console.log("Album the song is on: " + data["tracks"]["items"][0]["album"].name)
        fs.appendFile("log.txt", "\n" + "spotify-this-song " + data["tracks"]["items"][0].name, function (err) {
            // If the code experiences any errors it will log the error to the console.
            if (err) {
                return console.log(err);
            }
        });
    });
};
//-----------------------------------END SPOTIFY API CALL----------------------------------------

//-----------------run the random.txt file-------------------------
//K, so this *functionally* works. But the methods of concatenating process.argv inputs does not work for space
//separated words on a text file. So I'm still hard coding this and I'm sad. 
//Additionally, a pile of rules have to be followed for anything to work from the text file:
//1.) Two inputs separated by commas.
//2.) By default, I assume whitespace in between multi-word movie or song titles. That way spotify search works fine.
//    And all I have to do is replace whitespace with plus signs for the movie api call.
function wildCard(params) {
    fs.readFile("random.txt", "utf8", function (error, data) {
        // If the code experiences any errors it will log the error to the console.
        if (error) {
            return console.log(error);
        }
        // Then split it by commas (to make it more readable)
        var dataArr = data.split(",");
        //K, so readme file takes orders and then optional requests (like movie or song titles), separated by commas
        var orders = dataArr[0];
        var otherStuff = dataArr[1];
        //then pass the modifiers to commandCall, which calls the respective function dependent on the order passed
        if (orders === "spotify-this-song") {
            spotify.search({ type: 'track', query: otherStuff }, function (err, data) {
                if (err) {
                    return console.log('Error occurred: ' + err);
                }
                console.log("Artist: " + data["tracks"]["items"][0].artists[0].name);
                console.log("Song title: " + data["tracks"]["items"][0].name)
                console.log("Preview link: " + data["tracks"]["items"][0].preview_url)
                console.log("Album the song is on: " + data["tracks"]["items"][0]["album"].name)
            });
        } else if (orders === "movie-this") {
            var movieName = otherStuff.replace(" ", "+")
            // Then run a request to the OMDB API with the movie specified
            var queryUrl = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&apikey=14a66ffa";
            //console.log(queryUrl); I know this works so commented out
            request(queryUrl, function (error, response, body) {
                // If the request is successful
                if (!error && response.statusCode === 200) {
                    // Then log the Release Year for the movie
                    console.log("Title: " + JSON.parse(body).Title + "\n" +
                        "Year release: " + JSON.parse(body).Year + "\n" +
                        "IMDB Rating: " + JSON.parse(body).Ratings[0].Value + "\n" +
                        "Rotten Tomatoes Rating: " + JSON.parse(body).Ratings[1].Value + "\n" +
                        "Country(ies) of Production: " + JSON.parse(body).Country + "\n" +
                        "Languages: " + JSON.parse(body).Language + "\n" +
                        "Plot: " + JSON.parse(body).Plot + "\n" +
                        "Actors: " + JSON.parse(body).Actors);
                };
            })
        } else {
            commandCall(orders, otherStuff);
        }
        fs.appendFile("log.txt", "\n" + "do-what-it-says", function (err) {
            // If the code experiences any errors it will log the error to the console.
            if (err) {
                return console.log(err);
            }
        });
    });
}
//this runs once!
var initialCommand = process.argv[2];
commandCall(initialCommand, process.argv);