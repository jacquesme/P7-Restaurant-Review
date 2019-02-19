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
    sortBy: document.getElementById('sort'),
    

    init: function() {

        Restaurant.loadRestaurants()
        Gmap.map = new google.maps.Map(document.getElementById('map'), Gmap.options);
        Gmap.infoWindow = new google.maps.InfoWindow

        //console.log('Init map')
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                Gmap.pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                Gmap.onLocationSuccess(Gmap.pos)
                Gmap.nearBySearchRestaurants(Gmap.pos);
                Gmap.mapDragged();
                Gmap.autoComplete();
                
            }, Gmap.onLocationError)
        }else {
            console.log("Your browser doesn't support geolocation")
        }

    },

    onLocationError: function () {
        Gmap.map.getCenter()
        alert('Error trying to locate you !');
    },

    onLocationSuccess: function (pos) {
        //adds the circle of where you are
        var marker_red = 'app/assets/images/marker_red.png';
        var marker = new google.maps.Marker({
            position: Gmap.pos,
            icon: marker_red,
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

    nearBySearchRestaurants: function() {
        var request = {
            location: Gmap.pos,
            radius: 1000,
            type: ['restaurant']
        }
        //Uses the places api to search for places of type restaurant
        var service = new google.maps.places.PlacesService(Gmap.map);
        service.nearbySearch(request, Gmap.callback);
    }, 

    callback: function() {
        Gmap.search();
        Gmap.map.setCenter();
    },

    //Creates the markers with stars and adds default if no rating
    createMarker: function(result) {
        var rating = Math.round(result.rating);
        var markerIcon;
        if (isNaN(rating)) {
            markerIcon = 'app/assets/images/' + 'marker_default.png';
        } else {
            markerIcon = 'app/assets/images/' + 'marker_' + rating + '.png';
        }
        return markerIcon;
        //Call create marker and place on the map from here
    },

    //Adds the results and the markers
    addResultsAndMarkers: function(markersI, array, i){
        Gmap.addResultList(array[i], markersI);
        Restaurant.markers[markersI].placeResult = array[i];
        setTimeout(Gmap.dropMarker(markersI), i * 100);
    },

    //Drops the markers onto the map
    dropMarker: function(i) {
        return function () {
            Restaurant.markers[i].setMap(Gmap.map);
        };
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
        Gmap.sortBy.value = 'allStars';
        var place = autocomplete.getPlace();
        if (place.geometry) {
            Gmap.map.panTo(place.geometry.location);
            Gmap.map.setZoom(15);
            Gmap.search();
        } else {
            document.getElementById('autocomplete').placeholder = 'Search for a City';
        }
    },

    //If the map is dragged search again for restaurants in vicinity
    mapDragged: function() {
        Gmap.map.addListener('dragend', function () {
            Gmap.sortBy.value = 'allStars';
            Restaurant.myRestaurants = [];
            Gmap.search();
        });
    },

    search: function() {
        const places = new google.maps.places.PlacesService(Gmap.map);
        var search = {
            bounds: Gmap.map.getBounds(),
            type: ['restaurant']
        };
        places.nearbySearch(search, function (results, status) {
    
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                Gmap.clearResults();
                Gmap.clearMarkers();
    
                //Restaurant.googleRestaurants = []; Remove
                for (let i = 0; i < results.length; i++) {
                    Restaurant.googleRestaurants.push(results[i]);
                    Restaurant.markers[i] = new google.maps.Marker({
                        position: results[i].geometry.location,
                        placeId: results[i].id,
                        icon: Gmap.createMarker(Restaurant.googleRestaurants[i]),
                    });
                    Gmap.addResultsAndMarkers(i, results, i);
                }
                /*for (let i = 0; i < results.length; i++) {
                    
                }*/
                for (var i = 0; i < Restaurant.myRestaurants.length; i++) {
                    Restaurant.markers[Restaurant.googleRestaurants.length +i] = new google.maps.Marker({
                        position: Restaurant.myRestaurants[i].geometry.location,
                        placeId: Restaurant.myRestaurants[i].id,
                        icon: Gmap.createMarker(Restaurant.myRestaurants[i]),
                        zIndex: 52,
                        id: Restaurant.myRestaurants[i].id,
                    });
                    //Function to sort
                    if (Gmap.sort3Star) {
                        if (Math.round(Restaurant.myRestaurants[i].rating) <= 3) {
                            Gmap.addResultsAndMarkers(Restaurant.googleRestaurants.length+i, Restaurant.myRestaurants, i);
                        }
                    } else if (Gmap.sort4Star) {
                        if (Math.round(Restaurant.myRestaurants[i].rating) === 4) {
                            Gmap.addResultsAndMarkers(Restaurant.googleRestaurants.length+i, Restaurant.myRestaurants, i);
                        }
                    } else if (Gmap.sort5Star) {
                        if (Math.round(Restaurant.myRestaurants[i].rating) === 5) {
                            Gmap.addResultsAndMarkers(Restaurant.googleRestaurants.length+i, Restaurant.myRestaurants, i);
                        }
                    } else {
                        if (Gmap.sortAsc) {
                            Restaurant.myRestaurants.sort(function (a, b) {
                                return b.rating - a.rating;
                            });
                        } else if (Gmap.sortDesc) {
                            Restaurant.myRestaurants.sort(function (a, b) {
                                return a.rating - b.rating;
                            });
                        }
                        Gmap.addResultsAndMarkers(Restaurant.googleRestaurants.length+i, Restaurant.myRestaurants, i);
                    }
    
                }
            }
        });
    },

    //Resets the values of the markers
    clearMarkers: function() {
        for (var i = 0; i < Restaurant.markers.length; i++) {
            if (Restaurant.markers[i]) {
                Restaurant.markers[i].setMap(null);
            }
        }
        Restaurant.markers = [];
    },

    //Resets the values
    clearResults: function() {
        var results = document.getElementById('results');
        while (results.childNodes[0]) {
            results.removeChild(results.childNodes[0]);
        }
    },

    //Create a photo from the maps api
    createPhoto: function(place) {  
        var photos = place.photos;

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

    //Creates the list of restaurants on the right of the map
    addResultList: function(result, i) {
        var resultsDiv = document.getElementById('results');
        var listDiv = document.createElement('div');
        listDiv.setAttribute('class', 'results-list');
        listDiv.onclick = function () {
            google.maps.event.trigger(markers[i], 'click');
        };
        var details = `<div class="placeIcon"><img src ="${Gmap.createPhoto(result)}" /></div>
                        <div class="placeDetails">
                        <div class="name">${result.name}</div>`;
        if(result.rating){
            details += `<div class="rating">${Gmap.starRating(result)}</div>`;
        }
        details += `<a href="#restaurant-info" class="reviews-link">See Reviews</a>
                    </div>`;
        listDiv.insertAdjacentHTML("beforeEnd", details);
        resultsDiv.appendChild(listDiv);
    },

    createInfoWindow: function() {
        infowindowSmall = google.maps.InfoWindow({
         content: document.getElementById()   
        });
    }

};



























//Search function for searching new restaurants when map is dragged or place changed
/*search: function() {
        
    var places = new google.maps.places.PlacesService(Gmap.map);
    var search = {
        bounds: Gmap.map.getBounds(),
        type: ['restaurant']
    };


    places.nearbySearch(search, function (results, status) {

        if (status == google.maps.places.PlacesServiceStatus.OK){
            Gmap.clearMarkers();
            Gmap.clearResults();

            Restaurant.googleRestaurants = [];
            for (let i = 0; i < results.length; i++) {
                Restaurant.googleRestaurants.push(results[i]);
            }
                
            for(var i = 0; i < results.length; i ++) {
                Restaurant.googleRestaurants.push(results[i]);
                Gmap.createMarker(results[i].geometry.location.lat(), results[i].geometry.location.lng());
                Gmap.addResultList(results[i]);
            }

            // If the user clicks a restaurant marker, show the details of that restaurant
            google.maps.event.addListener(Restaurant.markers[0], 'mouseover', Gmap.showInfoWindowSmall);
            //google.maps.event.addListener(Restaurant.markers[i], 'mouseout', Gmap.closeInfoWindowSmall);
        }

    });

    Gmap.map.setCenter();

},*/