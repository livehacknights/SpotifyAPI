// BASED ON: https://github.com/JMPerez/passport-spotify/blob/master/examples/login

const spotify_client_id = process.env['spotify_client_id']
const spotify_client_secret = process.env['spotify_client_secret']
const app_url = 'https://SpotifyOauthtest.livehacknights.repl.co'
var authCallbackPath = '/auth/spotify/callback';

// Spotify Web API
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: spotify_client_id,
  clientSecret: spotify_client_secret,
  redirectUri: app_url + authCallbackPath
});

// Express JS
var express = require('express'),
  session = require('express-session'),
  passport = require('passport'),
  SpotifyStrategy = require('passport-spotify').Strategy,
  consolidate = require('consolidate');

var port = 8888;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    {
      clientID: spotify_client_id,
      clientSecret: spotify_client_secret,
      callbackURL: app_url + authCallbackPath,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.

				spotifyApi.setAccessToken(accessToken);

        return done(null, profile);
      });
    }
  )
);

var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(
  session({secret: 'keyboard cat', resave: true, saveUninitialized: true})
);
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

app.engine('html', consolidate.nunjucks);

app.get('/', function (req, res) {
  res.render('index.html', {user: req.user});
});

app.get('/account', ensureAuthenticated, function (req, res) {

  res.render('account.html', {user: req.user});
});

app.get('/login', function (req, res) {
  res.render('login.html', {user: req.user});
});

app.get('/plot', async function (req, res) {
	var playlist = await api().getPlaylistTracks('0OYfvSQr9XkNlHq3LVoaYW')
	var tracks = playlist.body.items.map(item => item.track.id)

	api().getAudioFeaturesForTracks(tracks).then(resp => {
		var songValues_arr = resp.body.audio_features.map(async (track) => {
			var track_details = await api().getTrack(track.id)
			console.log("TRACK: ", track)
			return {
				danceability: track.danceability,
				energy: track.energy,
				speechiness: track.speechiness,
				acousticness: track.acousticness,
				liveness: track.liveness,
				valance: track.valance,
				name: track_details.body.name
			}
		})

		Promise.all(songValues_arr).then((values) => {
		
			console.log("songValues_arr: ", values)
			console.log("SongValues: ", JSON.stringify(values))
			res.render('plot.html', {songValues: JSON.stringify(values)});
		});
	})
});

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private'],
    showDialog: true,
  })
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  authCallbackPath,
  passport.authenticate('spotify', {failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// Start the server manually
//startServer = function() {
	app.listen(port, function () {
		console.log('App is listening on port ' + port);
	});
//}


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Repl functions

api = function() {
	return spotifyApi
}

hola = function() {
	console.log("Hola Mundo")
}

// Repl
const repl = require('repl')

const repl_options = {
  prompt:  `(Spotify LHN) >`,
  useColors: true,
  breakEvalOnSigint: true
}

const replServer = repl.start(repl_options)
replServer.setupHistory(`${process.env.HOME}/._history`, err => err && console.log('Repl history error:', err))