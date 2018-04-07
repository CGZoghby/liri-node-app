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
        console.log("Command not recognized");
    }
}

//------------------------MOVIE API CALL-----------------------------------------------------
function movieSearch(params) {
    // Grab or assemble the movie name and store it in a variable called "movieName"
    function buildMovieTitle(input) {
        var args = ""; //initialize an arguments string that will become the fully assembled movieName passed into queryURL
        for (i = 0; process.argv.length - 3 > i; i++) {
            if (args === "") { //if the moviename is just starting assembly, don't need to concatenate a plus sign
                args += input[i + 3];
            } else {
                args += "+" + input[i + 3];
            };
        }
        return args;
    };
    //build the movie title based on user input
    var movieName = buildMovieTitle(process.argv);
    // Then run a request to the OMDB API with the movie specified
    var queryUrl = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&apikey=14a66ffa";
    //console.log(queryUrl); I know this works to commented out
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
                "Actors: " + JSON.parse(body).Actors + "\n");
        };
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
    });
};
//-----------------------------------END TWITTER API CALL-----------------------------------

//-----------------------------------SPOTIFY API CALL--------------------------------
function songSearch(params) {

    function buildSongTitle(input) {
        var args = ""; //initialize an arguments string that will become the fully assembled songName passed into queryURL
        for (i = 0; process.argv.length - 3 > i; i++) {
            if (args === "") { //if the song is just starting assembly, don't need to concatenate a blank space space
                args += input[i + 3];
            } else {
                args += " " + input[i + 3];
            };
        }
        return args;
    };

    var songName = buildSongTitle(process.argv);

    spotify.search({ type: 'track', query: songName }, function (err, data) {
        if (err) {
            return console.log('Error occurred: ' + err);
        }
        console.log("Artist: " + data["tracks"]["items"][0].artists[0].name);
        console.log("Song title: " + data["tracks"]["items"][0].name)
        console.log("Preview link: " + data["tracks"]["items"][0].preview_url)
        console.log("Album the song is on: " + data["tracks"]["items"][0]["album"].name)
        //for (var i = 0; i < data["tracks"]["items"].length; i++) {
        //    console.log(data["tracks"]["items"][i].artists[0].name)
        //    console.log(data["tracks"]["items"][i].name)
        //    console.log(data["tracks"]["items"][i].preview_url)
        //    console.log(data["tracks"]["items"][i]["album"].name)
        //}
    });
};
//-----------------------------------END SPOTIFY API CALL----------------------------------------

//-----------------run the random.txt file-------------------------
//ok, so the problem is that I need the functions to works without calling on process.argv directly
//it calls my-tweets a-ok, which is awesome, because that means my only issue is multi-string callbacks for movie or song
//titles.
function wildCard(params) {
    fs.readFile("random.txt", "utf8", function (error, data) {
        // If the code experiences any errors it will log the error to the console.
        if (error) {
            return console.log(error);
        }
        // We will then print the contents of data
        console.log(data);
        // Then split it by commas (to make it more readable)
        var dataArr = data.split(",");
        var orders = dataArr[0];
        var otherStuff = dataArr[1];
        console.log(otherStuff);
        commandCall(orders, otherStuff);
    });
}
//------------------------end random.txt file------------------------

//this runs once!
var initialCommand = process.argv[2];
commandCall(initialCommand, process.argv);