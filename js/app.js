var ViewModel = function() {
    var self = this;
    var markers = [];
    var photosUrls = [];    // contains Foursquare venue photo.
    var recommendedPlacesObjects = [];  // Foursauare recommended objects before filtering.
    // initial location (Chicago)
    var initialLatLng = {
        lat: 41.8781136,
        lng: -87.62979819
    };
    var infowindow = new google.maps.InfoWindow();
    var map;
    // Initialize map


    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: initialLatLng.lat, lng: initialLatLng.lng},
        zoom: 13,
        mapTypeControl: false,
        disableDefaultUI: true
    });

    // Shows up in the infobox when user input an address.
    self.location = ko.observable();
    self.placeSearchLatLng = ko.observable({
        searched: false
    });

    // User input keyword to filter the places.
    self.filterKeyword = ko.observable();
    // This array contains the Foursquare recommended places objects' tip, venue, marker, photoUrl.
    self.recommendedObjectsAndPhotosUrls = ko.observableArray();
    // filtered Foursquare recommended objects.
    self.filteredRecommendedObjects = ko.observableArray();
    self.input = ko.observable();


    // This function is activated when an user input new address.
    // it gets latitude and longitude by calling geocoder.
    // Call getGrouponDeals function if lat and lng is found.
    self.getLatLng = function() {
        var LatLngObject;
        var address = self.location();
        console.log("searching places :", address);
        console.log("observable: ", self.location());
        var geocoder = new google.maps.Geocoder();
        if (address === '') {
            window.alert('You must enter an area, or address.');
        } else {
            geocoder.geocode({ 'address': address}, function(results, status) {
                // The location is found.
                if (status === 'OK') {
                    self.placeSearchLatLng({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                        searched: true
                    });
                    LatLngObject = self.placeSearchLatLng();
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(13);
                    getPlacesFromFourSquare(LatLngObject);
                } else {
                    window.alert('We could not find that location - try entering a more' +
                        ' specific place.');
                }
            });
        }
    };


    // This function asynchronously filter the recommended places by title.
    self.filter = function(value) {
        self.filteredRecommendedObjects([]);
        for (var i = 0; i < self.recommendedObjectsAndPhotosUrls().length; i++) {
            console.log("inside of the for loop");
            title = self.recommendedObjectsAndPhotosUrls()[i].venue.venue.name.toLowerCase();
            console.log(title.indexOf(self.filterKeyword()));
            if (title.indexOf(self.filterKeyword()) !== -1) {
                self.filteredRecommendedObjects.push(self.recommendedObjectsAndPhotosUrls()[i]);
                markers[i].setMap(map);
            } else {
                markers[i].setMap(null);
            }
        }
    };

    self.filterKeyword.subscribe(self.filter);




    // Gets activated when user input the filter keyword. This function find the
    /*
    self.artFilter = function() {
        var keyword = self.filterKeyword();
        var title;
        if (keyword === undefined) {
            window.alert('You must enter an keyword.');
        } else {
            keyword = keyword.toLowerCase();
            self.filteredRecommendedObjects([]);
            for (var i = 0; i < self.recommendedObjectsAndPhotosUrls().length; i++) {
                console.log("inside of the for loop");
                title = self.recommendedObjectsAndPhotosUrls()[i].venue.venue.name.toLowerCase();
                console.log(title.indexOf(keyword));
                if (title.indexOf(keyword) !== -1) {
                    self.filteredRecommendedObjects.push(self.recommendedObjectsAndPhotosUrls()[i]);
                } else {
                    markers[i].setMap(null);
                }
            }
        }
    };
    */


    // Gets activated when user clicks on the recommended places on the infobox.
    // Takes filteredRecommendedObjects and creates a given marker's window.
    self.createInfoWindowByClicking = function(data) {
        var loc;
        loc = getLatLngFromVenue(data.venue.venue);
        setMapToAdjustedCenter(loc);
        createInfoWindow(data.marker, data.venue);
    };


    // this function call contains ajax request. After getting response it calls activator function.
    getPlacesFromFourSquare(initialLatLng);

    // This function loop through the foursquare recommended places objects and create
    // markers, infowindows, and an observable array that contains featured photos' urls.
    function activator() {
        var bounds = new google.maps.LatLngBounds();
        var tip;
        // empty the arrays first.
        photosUrls = [];
        hidePreviousMarkers();
        self.recommendedObjectsAndPhotosUrls([]);
        self.filteredRecommendedObjects([]);
        for (var i=0; i<recommendedPlacesObjects.length; i++) {
            createMarker(recommendedPlacesObjects[i], i, bounds);
            map.fitBounds(bounds);
            // create a photo url and push to the photosUrls array
            var photoUrl = createPhotoUrl(recommendedPlacesObjects[i], "140x90");
            photosUrls.push(photoUrl);
            // create and object contains venueObject and photoUrl in order to present in index.html
            if (recommendedPlacesObjects[i].tips === undefined) {
                tip = "No comment found.";
            } else {
                tip = recommendedPlacesObjects[i].tips[0].text;
            }
            self.recommendedObjectsAndPhotosUrls.push({
                tip: tip,
                venue: recommendedPlacesObjects[i],
                photoUrl: photosUrls[i],
                marker: markers[i]
            });

            self.filteredRecommendedObjects.push(self.recommendedObjectsAndPhotosUrls()[i]);
        }
    }

    // Take in LatLngObject and get recommended places from Foursquare.
    function getPlacesFromFourSquare(LatLngObject) {
        // empty the array first in order to save the called objects from foursquare.
        recommendedPlacesObjects = [];
        var latStirng = String(LatLngObject.lat);
        var lngString = String(LatLngObject.lng);
        var latlng = latStirng + "," + lngString;
        var venuePhotos = "1";
        var limit = 15;
        var section = "arts";
        var clientSecret = "0EHIINEPVE1ZQD4FC2LAKM5GZPISOUA134LG0SOANYH3FFSX";
        var clientId = "ANZPS2BD34JGX0S2MLMXRLENKUGGG50NQDMHQKCFV45BKPXY";
        var url = "https://api.foursquare.com/v2/venues/explore?" +
            "client_id=" + clientId +
            "&client_secret=" + clientSecret +
            "&ll=" + latlng +
            "&v=20170423" +
            "&limit=" + limit +
            "&section=" + section +
            "&venuePhotos=" + venuePhotos;
        // call foursqaure api based on the lat and lng
        $.ajax({
            url: url,
            method: 'GET'
        }).done(function(result) {
            // save the items objects to the observableArray.
            recommendedPlacesObjects = result.response.groups[0].items;
            // Activate this app by creating markers and infowindows.
            activator(LatLngObject);
        }).fail(function(err) {
            window.alert("Sorry, we could not find any recommended artzy near you :( Please try other location. ");
        });
    }


    // Creates a marker. Takes venuObject and index of the venuObject and the bounds.
    function createMarker(venueObject, index, bounds) {
        // add a function that delete all the previous markers;
        var venue = venueObject.venue;
        var loc;
        loc = getLatLngFromVenue(venue);

        var marker = new google.maps.Marker({
            position: loc,
            title: venue.name,
            animation: google.maps.Animation.DROP,
            map: map,
            id: index
        });

        // when user clicks the marker sets the map to the adjusted center and creates an window.
        marker.addListener('click', function() {
            setMapToAdjustedCenter(loc);
            createInfoWindow(this, venueObject);
        });
        bounds.extend(loc);
        markers.push(marker);
    }


    // This function is called when the user clicks the marker or link in the infobox.
    // window contains the restaurants' name, rating, tip, photo,
    function createInfoWindow(marker, venueObject) {
        if (infowindow.marker !== marker) {
            var content;
            var venue = venueObject.venue;
            var tip;
            var rating;

            // when venue does not have a comment.
            if (venueObject.tips === undefined) {
                tip = "No comment found.";
            } else {
                tip = venueObject.tips;
            }
            if (venue.rating){
                rating = venue.rating;
            } else {
                rating = "not rated";
            }
            var featuredPhotoUrl = createPhotoUrl(venueObject, "150x100");
            var addressOfVenue = venue.location.address + ", " + venue.location.city;

            content = "<div class='infowindow-div'><p class='infowindow-venue-name'><strong>" + venue.name + "</strong></p>";
            content += "<div class='infowindow-img-rating-div'>";
            content += "<img src=";
            content += "'"+ featuredPhotoUrl + "' class='featured-photo'>";
            content += "<p class='infowindow-rating'>";
            content += "Rating: " + rating + "</p>";
            content += "<p class='infowindow-address'>" + addressOfVenue + "</p>";
            content += "<a href='" + venue.url + "' class= 'website-link' target='_blank'>" + "Go to the website</a>";
            content += "</div>";
            content += "<div class='infowindow-tip-div'<span><strong>People Are Saying:</strong></span> <br>" + tip[0].text + "</div>";
            content += "</div>";

            infowindow.setContent(content);
            infowindow.open(map, marker);
        }
    }


    // Takes the venuObject and the size in string and return the photo url.
    function createPhotoUrl(venueObject, size) {
        var venue = venueObject.venue;
        if (venue.featuredPhotos) {
            var prefix = venue.featuredPhotos.items[0].prefix;
            var suffix = venue.featuredPhotos.items[0].suffix;
            var featuredPhotoUrl = prefix + size + suffix;
            return featuredPhotoUrl;
        } else {
            return "images/image-not-found.jpg";
        }
    }


    // return location object that has lat and lng as attributes.
    function getLatLngFromVenue(venue) {
        // some venue has labeledLatLngs array but some don't.
        // if there are lat and lat inside of location
        var loc;
        if (venue.location.lat && venue.location.lng) {
            loc = {
                lat: venue.location.lat,
                lng: venue.location.lng
            };
        } else {  // if there is labeledLatLngs array inside of location.
            loc = {
                lat: venue.location.labeledLatLngs[0].lat,
                lng: venue.location.labeledLatLngs[0].lng
            };
        }
        return loc;
    }


    // Hide the markers and delete the markers in the array.
    function hidePreviousMarkers() {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
         markers = [];
    }

    // set the map with adjusted center.
    function setMapToAdjustedCenter(loc) {
        loc.lat = loc.lat+0.003;
        loc.lng = loc.lng-0.003;
        map.setCenter(loc);
    }


    // when user clicks the hamburger bar it shows and hides the infobox.
    $(document).ready(function(){
        $("#navicon-link").click(function(){
            $(".infobox-info-div").slideToggle("fast");
        });
    });


    // auto complete
    var input = document.getElementById('search-location');

    var autoComplete = new google.maps.places.Autocomplete(input);

};


function googleMapCallBack() {
    ko.applyBindings(new ViewModel());
}
