var Gmap = {
    map: null,
    options : {
        center: {
            lat: 47.093043,
            lng: 37.542937
        },
        zoom: 15,
        streetViewControl: false
    },
    request: new XMLHttpRequest(),
    pos: null,
    photo: [],
    hasPhoto: null,

    init: function() {

        Restaurant.loadRestaurants()

        //Create the map
        Gmap.map = new google.maps.Map(document.getElementById('map'), Gmap.options);
        Gmap.infoWindow = new google.maps.InfoWindow

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                Gmap.pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                Gmap.onLocationSuccess(Gmap.pos);
                Gmap.nearBySearchRestaurants();
                Gmap.autoComplete();
                Gmap.map.addListener('dragend', Gmap.mapDragged);
        
            }, Gmap.onLocationError)
        }else {
            console.log("Your browser doesn't support geolocation")
        }
        
    },

    onLocationError: function () {
        Gmap.map.getCenter()
        alert('Error trying to locate you !');
    },

    //adds the circle of where you are
    onLocationSuccess: function (pos) {
        //adds the circle of where you are
        var image = 'app/assets/images/marker_red.png';
        var marker = new google.maps.Marker({
            position: Gmap.pos,
            icon: image,
            draggable: true
        });

        //adds animation to the circle of where you are
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null)
        }, 2000);

        //adds the marker of where you are
        marker.setMap(Gmap.map);
        Gmap.map.setCenter(pos);
    },

    //Nearby search for nearby restaurants
    nearBySearchRestaurants: function() {
        var request = {
            location: Gmap.pos,
            radius: 1000,
            type: ['restaurant']
        }
        //Uses the places api to search for places of type restaurant
        var service = new google.maps.places.PlacesService(Gmap.map);
        service.nearbySearch(request, Gmap.search);
    }, 

    //Create markers and place on the map
    createMarker: function(lat, lng) {
        var ratingResults;
        for(var i = 0; i < Restaurant.googleRestaurants.length; i ++) {
            ratingResults = Math.round(Restaurant.googleRestaurants[i].rating);
        }
        var markerIcon = null;
        //Choose marker icon with the relevent star ratings number
        if(ratingResults == 1) {
            markerIcon = 'app/assets/images/marker_1.png';
        }else if(ratingResults == 2) {
            markerIcon = 'app/assets/images/marker_2.png';
        }else if(ratingResults == 3) {
            markerIcon = 'app/assets/images/marker_3.png';
        }else if(ratingResults == 4) {
            markerIcon = 'app/assets/images/marker_4.png';
        }else if(ratingResults == 5) {
            markerIcon = 'app/assets/images/marker_5.png';
        }else {
            markerIcon = 'app/assets/images/marker_default.png';
        }
        //Create markers
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            placeId: Restaurant.googleRestaurants[0].id,
            map: Gmap.map,
            icon: markerIcon
        });
        //Place markers of nearby restaurants on the maps
        marker.setMap(Gmap.map);
        //Push all markers into markers array
        Restaurant.markers.push(marker);
    },

    //If map is dreagged search again for restaurants in the vicinity
    mapDragged: function() {
        Restaurant.googleRestaurants = [];
        Gmap.search();
    },

    autoComplete: function(){
        autocomplete = new google.maps.places.Autocomplete(
            //Input fields on autocomplete search for city
            /** @type {!HTMLInputElement} */
            (document.getElementById('autocomplete-input')), {
                types: ['(cities)'],
            }
        );
        
        //Call the on placeChangedFunction which searchs again to give new results
        autocomplete.addListener('place_changed', Gmap.onPlaceChanged);
        google.maps.event.trigger(Gmap.map, 'resize');
    },

    //When the user selects a city, get the place details for the city
    onPlaceChanged: function() {
        Restaurant.googleRestaurants = [];

        var place = autocomplete.getPlace();
        if (place.geometry) {
            Gmap.map.panTo(place.geometry.location);
            Gmap.map.setZoom(15);
            Gmap.search();
        } else {
            document.getElementById('autocomplete').placeholder = 'Search for a City';
        }
    },

    //Search for restaurants in vicinity every time the map bounds are changed
    search: function() {
        var places = new google.maps.places.PlacesService(Gmap.map);
        var search = {
            bounds: Gmap.map.getBounds(),
            type: ['restaurant']
        };

        places.nearbySearch(search, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                Gmap.clearResults();
                Gmap.clearMarker();
                Restaurant.getPlaces();

                for(var i = 0; i < results.length; i ++) {
                    Restaurant.googleRestaurants.push(results[i]);
                    Gmap.createMarker(results[i].geometry.location.lat(), results[i].geometry.location.lng());
                    Gmap.addRightHandResults(results[i]);
                };

                // If the user clicks a restaurant marker, show the details of that restaurant
                infoWindowSmall = new google.maps.InfoWindow({
                    content: document.getElementById('info-content-small')
                });
                google.maps.event.addListener(Restaurant.markers[i], 'mouseover', Gmap.showInfoWindowSmall);
    
            };
        });
    },

    //Clear markers from the map
    clearMarker: function() {
        for(var i = 0; i < Restaurant.markers.length; i ++) {
            if(Restaurant.markers[i]) {
                Restaurant.markers[i].setMap(null);
            };
        };
        Restaurant.markers = [];
    },

    clearResults: function() {
        var results = document.getElementById('results');
        while (results.childNodes[0]) {
            results.removeChild(results.childNodes[0]);
        }
    },

    //Create a photo from the maps api
    createPhoto: function() {
        for(var i = 0; i < Restaurant.googleRestaurants.length; i ++) {
            photo = Restaurant.googleRestaurants[i].photos;
        }
        var photos = photo;

        if (!photos) {
            photo = 'app/assets/images/food.png';
            hasPhoto = false;
        } else {
            hasPhoto = true;
            photo = photos[0].getUrl({
                'maxWidth': 600,
                'maxHeight': 400
                });
            }   
        return photo;   
        
    },

    //Creates the stars for the rating
    starRating: function(place) {
        var rating = [];
        if (place.rating) {
            for (let i = 0; i < 5; i++) {
                if (place.rating < (i + 0.5)) {
                    rating.push('&#10025;');
                } else {
                    rating.push('&#10029;');
                }
            }
            return rating.join(' ');
        }
    },

    //Add search result to the right-hand side of the page
    addRightHandResults: function(results) {

        var resultsDiv = document.getElementById('results');
        var listDiv = document.createElement('div');
        listDiv.setAttribute('class', 'results-list');

        var details = `<div class="placeIcon"><img src ="${Gmap.createPhoto()}" /></div>
                        <div class="placeDetails"></div>
                        <div class="name">${results.name}</div>`; 
        
        if(results.rating) {
            details += `<div class="rating">${Gmap.starRating(results)}</div>`;
        };

        details += `<a href="#restaurant-info" class="reviews-link">See Reviews</a>
                    </div>`;

        listDiv.insertAdjacentHTML("beforeEnd", details);
        resultsDiv.appendChild(listDiv); 
    },


}