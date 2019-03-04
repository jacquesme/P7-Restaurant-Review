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
    infoWindowSmall: null,

    init: function() {

        Restaurant.loadRestaurants()

        //Create the map
        Gmap.map = new google.maps.Map(document.getElementById('map'), Gmap.options);
        Gmap.infoWindowSmall = new google.maps.InfoWindow({
            content: document.getElementById('info-content-small')
        });

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
    createMarker: function(result) {
        var rating = Math.round(result.rating);
        var markerIcon;
        if (isNaN(rating)) {
            markerIcon = 'app/assets/images/' + 'marker_default.png';
        } else {
            markerIcon = 'app/assets/images/' + 'marker_' + rating + '.png';
        }
        return markerIcon;
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
                Gmap.clearMarkers();
    
                Restaurant.googleRestaurants = [];
                for (var i = 0; i < results.length; i++) {
                    Restaurant.googleRestaurants.push(results[i]);
                }
                for (var i = 0; i < results.length; i++) {
                    Restaurant.markers[i] = new google.maps.Marker({
                        position: results[i].geometry.location,
                        placeId: results[i].id,
                        //animation: google.maps.Animation.DROP,
                        icon: Gmap.createMarker(Restaurant.googleRestaurants[i]),
                        //zIndex: 52,
                    });
                    // If the user clicks a restaurant marker, show the details of that restaurant
                    //google.maps.event.addListener(markers[i], 'mouseover', restaurants.showInfoWindowSmall);
                    //google.maps.event.addListener(markers[i], 'mouseout', restaurants.closeInfoWindowSmall);
                    //google.maps.event.addListener(markers[i], 'click', restaurants.showInfoWindow);
                    //google.maps.event.addListener(map, "click", restaurants.closeInfoWindow);
    
                    var sort3Star = false, sort4Star = false, sort5Star = false, sortAsc = false, sortDesc = false;
                    if (sort3Star) {
                        if (Math.round(results[i].rating) <= 3) {
                            Gmap.addResultsAndMarkers(i, results, i);
                        }
                    } else if (sort4Star) {
                        if (Math.round(results[i].rating) === 4) {
                            Gmap.addResultsAndMarkers(i, results, i);
                        }
                    } else if (sort5Star) {
                        if (Math.round(results[i].rating) === 5) {
                            Gmap.addResultsAndMarkers(i, results, i);
                        }
                    } else {
                        if (sortAsc) {
                            results.sort(function (a, b) {
                                return b.rating - a.rating;
                            });
                        } else if (sortDesc) {
                            results.sort(function (a, b) {
                                return a.rating - b.rating;
                            });
                        }
                        Gmap.addResultsAndMarkers(i, results, i);
                    }
                }
            }    
            
        })
    },        

    //Clear markers from the map
    clearMarkers: function() {
        //Resets the values
        for (let i = 0; i < Restaurant.markers.length; i++) {
            if (Restaurant.markers[i]) {
                Restaurant.markers[i].setMap(null);
            }
        }
        Restaurant.markers = [];
    },

    clearResults: function() {
        var results = document.getElementById('results');
        while (results.childNodes[0]) {
            results.removeChild(results.childNodes[0]);
        }
    },

    //Create a photo from the maps api
    createPhoto: function(place) {
        //Creates the photo from the api   
        var photos = place.photos;
        var photo;
        var hasPhoto = null;

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

    addResultsAndMarkers: function(markersI, array, i){
        //Adds the results and the markers
        Gmap.addRightHandResults(array[i], markersI);
        Restaurant.markers[markersI].placeResult = array[i];
        setTimeout(Gmap.dropMarker(markersI), i * 100);
    },

    dropMarker: function(i) {
        //Drops the markers onto the map
        return function () {
            Restaurant.markers[i].setMap(Gmap.map);
        };
    },

    //Add search result to the right-hand side of the page
    addRightHandResults: function(result, i) {
        var resultsDiv = document.getElementById('results');
        var listDiv = document.createElement('div');
        listDiv.setAttribute('class', 'results-list');
        listDiv.onclick = function () {
            google.maps.event.trigger(Restaurant.markers[i], 'click');
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

    //Builds the small info Window
    
    

}






    