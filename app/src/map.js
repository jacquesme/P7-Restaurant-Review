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
    hasPhoto: true,
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
                Gmap.submitAddRestaurant();
                Gmap.addTopReview();
                myModal.loadModal();
        
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
        Gmap.sortBy.value = 'allStars';
        Restaurant.googleRestaurants = [];
        Gmap.restSort();
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
                    google.maps.event.addListener(Gmap.map, "click", Gmap.closeInfoWindow);
    
                    Gmap.sortRestaurants(i, results, i);
                       
                }
                
                Restaurant.getPlaces();
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

    //Shows the info window with details of the restaurant
    showInfoWindowMy: function() {
        Gmap.closeInfoWindowSmall();
        var marker = this;
        infoWindow.open(Gmap.map, marker);
        Gmap.buildIWContent(Restaurant.myRestaurants[marker.id]);
        Gmap.displayRestaurantInfo(Restaurant.myRestaurants[marker.id]);
    },
    
    //Shows the info window with details of the restaurant
    showInfoWindowSmallMy: function() {
        Gmap.closeInfoWindowSmall();
        var marker = this;
        infoWindowSmall.open(Gmap.map, marker);
        Gmap.buildIWContentSmall(Restaurant.myRestaurants[marker.id]);
    },
    
    //Builds the small info Window
    buildIWContentSmall: function(place) {
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

    //Shows the info window with details of the restaurant
    showInfoWindow: function() {
        var places = new google.maps.places.PlacesService(Gmap.map);
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
        Gmap.showTheForm();
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

        /*-----------------------------------------------------------------------------------
        adds the street view functionality
        -------------------------------------------------------------------------------------*/
    
       var sv = new google.maps.StreetViewService();
       sv.getPanorama({
           location: place.geometry.location,
           radius: 50
       }, processSVData);
   
       var panoDiv = document.getElementById('pano');
       var streetViewWrapper = document.getElementById('street-view-wrapper');
       var photoDiv = document.getElementById('photo');
       var seePhoto = document.getElementById('see-photo');
       //var seeStreetView = document.getElementById('see-street-view');
       photoDiv.innerHTML = '<img class="photo-big" ' + 'src="' + Gmap.createPhoto(place) + '"/>';
   
       streetViewWrapper.style.display = 'block';
       photoDiv.style.display = 'none';
       if(Gmap.hasPhoto){
           seePhoto.style.display = 'block';
       }else{
           seePhoto.style.display = 'none';
       }
   
       function processSVData(data, status) {
           if (status === 'OK') {
               var panorama = new google.maps.StreetViewPanorama(panoDiv);
               panorama.setPano(data.location.pano);
               panorama.setPov({
                   heading: 270,
                   pitch: 0
               });
               panorama.setVisible(true);
               
               /*-----------------------------------------------------------------------------------
               click photo  button and show photo hide street view
               -------------------------------------------------------------------------------------*/
               seePhoto.addEventListener("click", function(){
                   seePhoto.style.display = 'none';
                   streetViewWrapper.style.display = 'none';
                   photoDiv.style.display = 'block';
               });
   
           } else {
               seePhoto.style.display = 'none';
               streetViewWrapper.style.display = 'none';
               photoDiv.style.display = 'block';
           }
       }
        
    },

    //Close the Bigger Info Windows
    closeInfoWindow: function() {
        var marker = this;
        infoWindow.close(Gmap.map, marker);
    },

    //Right clicking could be used to add new restaurant
    rightClickNewMarker: function() {
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

    //Create new restaurant with name, address, star rating, web address and phone number
    submitAddRestaurant: function() {
        
        document.getElementById("form-add-restaurant").addEventListener("submit", function (e) {
            e.preventDefault();
            Gmap.form.style.padding = '';
            var name = document.getElementById('res-name');
            var address = document.getElementById('res-address');
            var telephone = document.getElementById('res-telephone');
            var website = document.getElementById('res-website');
            var rating = document.getElementById('res-rating');
            var locationLat = document.getElementById('res-location-lat');
            var locationLng = document.getElementById('res-location-lng');

            var position = new google.maps.LatLng(locationLat.value, locationLng.value);
            var foodImg = 'app/assets/images/food.png';
            var place = {
                name: name.value,
                vicinity: address.value,
                website: website.value,
                url: website.value,
                formatted_phone_number: telephone.value,
                rating: rating.value,
                position: position,
                geometry: {location: position},
                icon: foodImg,
                reviews: '',
                photos: '',

            };
    
            //Pushes to array so that it knows which new restaurant to open when you add more than one
            Gmap.newPlace.push(place);
            Gmap.closeInfoWindowNew();
            var marker = Restaurant.newRestaurantMarker[Gmap.newResNum];
            Gmap.restaurantIsNew = false;
            infoWindow.open(Gmap.map, marker);
            Gmap.buildIWContent(place);
            Gmap.displayRestaurantInfo(place);

        }, function (error) {
            var loadingDiv= document.getElementById('loading');
            if(error.code === 0){
            loadingDiv.innerHTML = "An unknown error occurred.";
            } else if(error.code === 1) {
                loadingDiv.innerHTML = "User denied the request for Geolocation. Refresh the broswer and allow Geolocation";
            } else if(error.code === 2) {
                loadingDiv.innerHTML = "Location information is unavailable.";
            } else if(error.code === 3) {
                loadingDiv.innerHTML = "The request to get user location timed out.";
            }
            handleLocationError(true, infoWindow, Gmap.map.getCenter(pos));
        },
        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
            infoWindow.open(Gmap.map);

        });
    },

    //Close the New InfoWindow
    closeInfoWindowNew: function() {
        var marker = this;
        infoWindowNew.close(Gmap.map, marker);
    },

    //Form functionality on submit add new review to top of reviews and save to array
    addTopReview: function() {
        
        document.getElementById("add-review").addEventListener("submit", function (e) {
            e.preventDefault();
            var newName = document.getElementById("your-name");
            var newRating = document.getElementById("your-rating");
            var newReview = document.getElementById("your-review");
            if (!(newName.value && newRating.value && newReview.value)) { //if not empty return
                return;
            }
            Gmap.addReview(newName.value, newRating.value, newReview.value); //add to array values from form
            newName.value = ""; //reset form values to 0
            newRating.value = "";
            newReview.value = "";
            Gmap.hideTheForm(); //hide form and add button
        });
    },

    addReview: function(newName, newRating, newReview) { //add to array and to the page
        var newReviewDetails = {
            name: newName,
            rating: newRating,
            review: newReview,
        };
        var avatar = 'app/assets/images/avatar.png';
        var reviewsDiv = document.getElementById('reviews');
        var newReviewHTML = '';
        newReviewHTML += `<div class="restaurant-reviews">
                            <h3 class="review-title">
                            <span class="profile-photo" style="background-image: url('${avatar}')"></span>
                            <span id="review-rating" class="rating">${Gmap.starRating(newReviewDetails)}</span>
                            </h3>
                            <p> ${newReviewDetails.review} </p>
                        </div>`;
        Restaurant.newReviewArray.push(newReviewDetails); //push new values to array to store them
        reviewsDiv.insertAdjacentHTML("afterbegin", newReviewHTML); //add to the top of content
    },

    // Shows the form for the restaurant reviews
    showTheForm: function() {
        document.getElementById("form-wrapper").style.display = 'block';
    },

    // Hides the form for the restaurant reviews
    hideTheForm: function() {
        document.getElementById("form-wrapper").style.display = 'none';
    },
        

} 