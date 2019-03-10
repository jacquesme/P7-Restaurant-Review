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
    newResNum: null,
    newPlace: [],
    photo: [],
    hasPhoto: null,
    pos: null,
    restaurantIsNew: true,
    sort3Star: false, 
    sort4Star: false, 
    sort5Star: false,
    sortDesc: false, 
    sortAsc: false,  
    restaurantInfoDiv: document.getElementById('restaurant-info'),
    form: document.getElementById('form-add-restaurant'),
    hostnameRegexp: new RegExp('^https?://.+?/'),
    sortBy: document.getElementById('sort'),

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
                Gmap.sortByRating();
                Gmap.createInfoWindow();
                Gmap.rightClickNewMarker();
        
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
        Gmap.sortBy.value = 'allStars';
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
                    google.maps.event.addListener(Restaurant.markers[i], 'mouseover', Gmap.showInfoWindowSmall);
                    google.maps.event.addListener(Restaurant.markers[i], 'mouseout', Gmap.closeInfoWindowSmall);
                    google.maps.event.addListener(Restaurant.markers[i], 'click', Gmap.showInfoWindow);
                    //google.maps.event.addListener(map, "click", restaurants.closeInfoWindow);
    
                    Gmap.sortRestaurants(i, results, i);
                    
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

    //Add the results and the markers to the map
    addResultsAndMarkers: function(markersI, array, i){
        Gmap.addRightHandResults(array[i], markersI);
        Restaurant.markers[markersI].placeResult = array[i];
        setTimeout(Gmap.dropMarker(markersI), i * 100);
    },

    //Drops the markers onto the map
    dropMarker: function(i) {
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

    restSort: function() {
        sortAsc = false;
        sortDesc = false;
        sort4Star = false;
        sort3Star = false;
        sort5Star = false;
        allStars = false;
    },

    sortRestaurants: function(i, results, i) {
        
        if (Gmap.sort3Star) {
            if (Math.round(results[i].rating) <= 3) {
                Gmap.addResultsAndMarkers(i, results, i);
            }
        } else if (Gmap.sort4Star) {
            if (Math.round(results[i].rating) === 4) {
                Gmap.addResultsAndMarkers(i, results, i);
            }
        } else if (Gmap.sort5Star) {
            if (Math.round(results[i].rating) === 5) {
                Gmap.addResultsAndMarkers(i, results, i);
            }
        } else {
            if (Gmap.sortAsc) {
                results.sort(function (a, b) {
                    return b.rating - a.rating;
                });
            } else if (Gmap.sortDesc) {
                results.sort(function (a, b) {
                    return a.rating - b.rating;
                });
            }
            Gmap.addResultsAndMarkers(i, results, i);
        }
    },

    //Event listener for sort by star rating
    sortByRating: function() { 
        Gmap.sortBy.addEventListener('change', function () {
            if (Gmap.sortBy.value === 'sortAsc') {
                Gmap.restSort();
                Gmap.sortAsc = true;
                Gmap.search();
    
            } else if (Gmap.sortBy.value === 'sortDesc') {
                Gmap.restSort();
                Gmap.sortDesc = true;
                Gmap.search();
            }
            else if (Gmap.sortBy.value === 'sort4Star') {
                Gmap.restSort();
                Gmap.sort4Star = true;
                Gmap.search();
            }
            else if (Gmap.sortBy.value === 'sort3Star') {
                Gmap.restSort();
                Gmap.sort3Star = true;
                Gmap.search();
            }
            else if (Gmap.sortBy.value === 'sort5Star') {
                Gmap.restSort();
                Gmap.sort5Star = true;
                Gmap.search();
            }
            else if (Gmap.sortBy.value === 'allStars') {
                Gmap.restSort();
                Gmap.allStars = true;
                Gmap.search();
            }
        });
    },

    //Builds the small info Window
    createInfoWindow: function(){
        infoWindow = new google.maps.InfoWindow({
        content: document.getElementById('info-content')
        });
        infoWindowSmall = new google.maps.InfoWindow({
            content: document.getElementById('info-content-small'),
        });
        infoWindowNew = new google.maps.InfoWindow({
            content: document.getElementById('info-content-new-restaurant'),
        });

        infoWindow.setPosition(Gmap.pos); 
    },

    //Shows the info window with details of the restaurant
    showInfoWindowSmall: function() {
        var places = new google.maps.places.PlacesService(Gmap.map);
        Gmap.closeInfoWindow();
        var marker = this;
        places.getDetails({
            placeId: marker.placeResult.place_id
        }, function(place, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }
            infoWindowSmall.open(Gmap.map, marker);
            Gmap.buildIWContentSmall(place);
        });
    },
    
    buildIWContentSmall: function(place) {
        //Builds the small info Window
        document.getElementById('info-content-small').style.display = 'block';
        document.getElementById('iw-icon-small').innerHTML = '<img class="photo" ' + 'src="' + Gmap.createPhoto(place) + '"/>';
        document.getElementById('iw-url-small').innerHTML = '<b>' + place.name + '</b>';
        if (place.rating) {
            var ratingHtml = '';
            for (var i = 0; i < 5; i++) {
                if (place.rating < (i + 0.5)) {
                    ratingHtml += '&#10025;';
                } else {
                    ratingHtml += '&#10029;';
                }
                document.getElementById('iw-rating-small').style.display = '';
                document.getElementById('iw-rating-small').innerHTML = ratingHtml;
            }
        } else {
            document.getElementById('iw-rating-small').style.display = 'none';
        }
    },

    //Close the Small InfoWindow
    closeInfoWindowSmall: function() {
        var marker = this;
        infoWindowSmall.close(Gmap.map, marker);
    },

    showInfoWindow: function() {
        //Shows the info window with details of the restaurant
        const places = new google.maps.places.PlacesService(Gmap.map);
        Gmap.closeInfoWindowSmall();
        var marker = this;
        places.getDetails({
            placeId: marker.placeResult.place_id
        }, function(place, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }
            infoWindow.open(Gmap.map, marker);
            Gmap.buildIWContent(place);
            Gmap.displayRestaurantInfo(place);
        });                    
    },

    //Builds the bigger info Window
    buildIWContent: function(place) {
        document.getElementById('info-content').style.display = 'block';
        document.getElementById('iw-icon').innerHTML = '<img class="photo" ' + 'src="' + Gmap.createPhoto(place) + '"/>';
        document.getElementById('iw-url').innerHTML = '<b><a href="#restaurant-info">' + place.name + '</a></b>';
        document.getElementById('iw-address').textContent = place.vicinity;
        if (place.formatted_phone_number) {
            document.getElementById('iw-phone').style.display = '';
            document.getElementById('iw-phone').textContent = place.formatted_phone_number;
        } else {
            document.getElementById('iw-phone').style.display = 'none';
        }
        if (place.rating) {
            var ratingHtml = '';
            for (var i = 0; i < 5; i++) {
                if (place.rating < (i + 0.5)) {
                    ratingHtml += '&#10025;';
                } else {
                    ratingHtml += '&#10029;';
                }
                document.getElementById('iw-rating').style.display = '';
                document.getElementById('iw-rating').innerHTML = ratingHtml;
            }
        } else {
            document.getElementById('iw-rating').style.display = 'none';
        }
        if (place.website) {
            var website = Gmap.hostnameRegexp.exec(place.website);
            if (website === null) {
                website = 'http://' + place.website + '/';
            }
            document.getElementById('iw-website').style.display = '';
            document.getElementById('iw-website').innerHTML = '<a href="' + website + '">' + place.website + '</a>';
    
        } else {
            document.getElementById('iw-website').style.display = 'none';
        }
        if (place.opening_hours) {
            if (place.opening_hours.open_now) {
                document.getElementById('iw-open').style.display = '';
                document.getElementById('iw-open').textContent = 'Open Now';
            } else {
                document.getElementById('iw-open').style.display = 'none';
            }
        }
        document.getElementById('iw-reviews').textContent = 'See Reviews'
    },

    //Displays extra info below when restaurant is clicked
    displayRestaurantInfo: function(place) {
        //restaurants.showTheForm();
        Gmap.restaurantInfoDiv.style.display = "block";
        document.getElementById('name').textContent = place.name;
        document.getElementById('address').textContent = place.vicinity;
        document.getElementById('telephone').textContent = place.formatted_phone_number;
        if (place.website) {
            var website = Gmap.hostnameRegexp.exec(place.website);
            if (website === null) {
                website = 'http://' + place.website + '/';
            }
            document.getElementById('website').innerHTML = '<a href="' + website + '">Visit Restaurant Website</a>';
        }
        var reviewsDiv = document.getElementById('reviews');
        var reviewHTML = '';
        reviewsDiv.innerHTML = reviewHTML;
        if (place.reviews) {
            if (place.reviews.length > 0) {
                for (var i = 0; i < place.reviews.length; i ++) {
                    var review = place.reviews[i];
                    var avatar;
                    if (place.reviews[i].profile_photo_url) {
                        avatar = place.reviews[i].profile_photo_url;
                    } else {
                        avatar = './image/avatar.png';
                    }
                    reviewHTML += `<div class="restaurant-reviews">
                                <h3 class="review-title">
                                    <span class="profile-photo" style="background-image: url('${avatar}')"></span>`;
                    if(place.rating){
                        reviewHTML +=  `<span id="review-rating" class="rating">${Gmap.starRating(review)}</span>`;
                    }
                    reviewHTML +=  ` </h3>
                                        <p> ${place.reviews[i].text} </p>
                                    </div>`;
                    reviewsDiv.innerHTML = reviewHTML;
                }
            }
        }
    
    },

    //Close the Bigger Info Windows
    closeInfoWindow: function() {
        var marker = this;
        infoWindow.close(Gmap.map, marker);
    },

    rightClickNewMarker: function() {
        //Right clicking could be used to add new restaurant
        Gmap.map.addListener('rightclick', function (e) {
            Gmap.closeInfoWindow();
            Gmap.restaurantIsNew = true;
            Gmap.newResNum = -1;
            var latlng = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
            var marker = new google.maps.Marker({
                position: latlng,
                icon: Gmap.createMarker(latlng),
                id: Gmap.newResNum + 1
            });
            google.maps.event.addListener(marker, 'click', Gmap.addRestaurantInfoWindow);
            marker.setMap(Gmap.map);
        });
    },

    addRestaurantInfoWindow: function() {
        var marker = this;
        if (Gmap.restaurantIsNew) {
            infoWindowNew.open(Gmap.map, marker);
            Gmap.buildResDetailContent(marker);
            Restaurant.newRestaurantMarker.push(marker);
            Gmap.newResNum += 1;
        } else {
            infoWindow.open(Gmap.map, marker);
            Gmap.buildIWContent(Gmap.newPlace[marker.id]);
            Gmap.displayRestaurantInfo(Gmap.newPlace[marker.id]);
        }
    },

    //Builds the new Restaurant info Window
    buildResDetailContent: function(marker) {
    
        Gmap.restaurantInfoDiv.style.display = "block";
        Gmap.form.style.padding = '10px';
        Gmap.form.innerHTML = `
            <h3 class="add-res-heading">Add A Restaurant</h3>
            <input type="text" id="res-name" name="res-name" placeholder="Restaurant Name" required/>
            <input type="hidden" id="res-location-lat" name="res-location-lat" value="${marker.position.lat()}"/>
            <input type="hidden" id="res-location-lng" name="res-location-lng" value="${marker.position.lng()}"/>
            <input type="text" name="res-address" id="res-address" placeholder="Restaurant Address" required/>
            <label for="res-rating">Rating: </label>
            <select name="res-rating" id="res-rating" required>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            <input type="text" name="res-telephone" id="res-telephone" placeholder="Restaurant Telephone" />
            <input type="text" name="res-website" id="res-website" placeholder="Restaurant Website" />
            <button id="add-restaurant" class="button add-restaurant">Add New Restaurant</button>`;
    },

}






    