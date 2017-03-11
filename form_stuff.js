// wait for DOM, facebook auth, and socket connection
var docReady = $.Deferred();
$(document).ready(docReady.resolve);

var  accessToken    =  null;
var  receivedToken  =  $.Deferred();
var  uid            =  null;

var facebookReady = $.Deferred();
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1391443554220655',
        cookie     : true,
        xfbml      : true,
        version    : 'v2.8'
    });
    facebookReady.resolve();
    checkLogin()
};

var socketReady = $.Deferred();
var socket = io('https://socket.memoryarchive.net/');
socket.on('connect', function() {
    socket.on('photos', function (photos) {
        receivedToken.then(function () {
            photos.forEach(function (photo) {
                $('#photos').prepend(makeImage(photo, 100, 100));
            });
        })
    });
    socketReady.resolve();
});

$.when(docReady, socketReady, receivedToken).then(function () {
    console.log('socket ready and received fb token')
    getPhotos(function (photos) {
        photos.map(function (photo) {
            return makeFacebookPhotoURL(photo, accessToken);
        })
        socket.emit('photos', getRandom(photos, 10));
    });
});

// call facebook script
(function(d){
    var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "https://connect.facebook.net/en_US/all.js";
    d.getElementsByTagName('head')[0].appendChild(js);
}(document));

// http://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
}

function makeImage(src, height, width) {
    var newImg = new Image(height, width);
    newImg.src = src;
    return newImg;
}

function checkLogin () {
    if (!accessToken) {
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                accessToken = response.authResponse.accessToken;
                uid = response.authResponse.userID;
                receivedToken.resolve(accessToken);
            }
        })
    }
}

/**
 * This is the getPhoto library
 */
            function makeFacebookPhotoURL( id, accessToken ) {
                return 'https://graph.facebook.com/' + id + '/picture?access_token=' + accessToken;
            }
            function getAlbums( callback ) {
                FB.api(
                    '/me/albums',
                    {fields: 'id,cover_photo'},
                    function(albumResponse) {
//console.log( ' got albums ' );
if (callback) {
    callback(albumResponse);
}
                    }
                );
            }
function getPhotosForAlbumId( albumId, callback ) {
    FB.api(
        '/'+albumId+'/photos',
        {fields: 'id'},
        function(albumPhotosResponse) {
            //console.log( ' got photos for album ' + albumId );
            if (callback) {
                callback( albumId, albumPhotosResponse );
            }
        }
    );
}
function getLikesForPhotoId( photoId, callback ) {
    FB.api(
        '/'+albumId+'/photos/'+photoId+'/likes',
        {},
        function(photoLikesResponse) {
            if (callback) {
                callback( photoId, photoLikesResponse );
            }
        }
    );
}
function getPhotos(callback) {
    var allPhotos = [];
    getAlbums(function(albumResponse) {
        var i, album, deferreds = {}, listOfDeferreds = [];
        for (i = 0; i < albumResponse.data.length; i++) {
            album = albumResponse.data[i];
            deferreds[album.id] = $.Deferred();
            listOfDeferreds.push( deferreds[album.id] );
            getPhotosForAlbumId( album.id, function( albumId, albumPhotosResponse ) {
                var i, facebookPhoto;
                for (i = 0; i < albumPhotosResponse.data.length; i++) {
                    facebookPhoto = albumPhotosResponse.data[i];
                    allPhotos.push(makeFacebookPhotoURL( facebookPhoto.id, accessToken ));
                }
                deferreds[albumId].resolve();
            });
        }
        $.when.apply($, listOfDeferreds ).then( function() {
            if (callback) {
                callback( allPhotos );
            }
        }, function( error ) {
            if (callback) {
                callback( allPhotos, error );
            }
        });
    });
}
$( "#twilio-form" ).validate({
    rules: {
        field: {
            required: true,
            phoneUS: true
        }
    }
});
$("#twilio-form").submit(function(e){
    e.preventDefault();
    if (accessToken && uid) {
        console.log('accessToken recieved, sending uid and phone number');
        socket.emit('uid', uid);
        var number = document.querySelector('#twilio-number-input').value;
        socket.emit('number', number);
    }
});
// On submit, replace Twilio form with a conformation, also on login add a (thanks for logging in confirmation)
// "Don't proceed until the following checkboxes are filled" (noteditable) form at top of the page ??? :D
//
//
// - ask Luke to go through it on his phone to make sure?
