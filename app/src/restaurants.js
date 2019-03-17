var Restaurant = {
    myRestaurants: [],
    googleRestaurants: [],
    markers: [],
    newRestaurantMarker: [],
    newReviewArray: [],
    
    loadRestaurants: function () {
        Gmap.request.open('GET', 'http://localhost:3000/results', true); // Replace 'my_data' with the path to your file
        Gmap.request.onload = Restaurant.getPlaces
        Gmap.request.send(null);
    },

    getPlaces: function () {
        Restaurant.myRestaurants = JSON.parse(Gmap.request.responseText);
        /*Restaurant.myRestaurants.forEach(function (results, index) {
            Restaurant.myRestaurants[index] = results;
            Gmap.createMarker(Restaurant.myRestaurants[index].geometry.location.lat, Restaurant.myRestaurants[index].geometry.location.lng);
            Gmap.addRightHandResults(Restaurant.myRestaurants[index]);
        })*/
        for (var i = 0; i < Restaurant.myRestaurants.length; i++) {
            Restaurant.markers[Restaurant.googleRestaurants.length +i] = new google.maps.Marker({
                position: Restaurant.myRestaurants[i].geometry.location,
                placeId: Restaurant.myRestaurants[i].id,
                icon: Gmap.createMarker(Restaurant.myRestaurants[i]),
                zIndex: 52,
                id: Restaurant.myRestaurants[i].id,
            });

            google.maps.event.addListener(Restaurant.markers[Restaurant.googleRestaurants.length +i], 'mouseover', Gmap.showInfoWindowSmallMy);
            google.maps.event.addListener(Restaurant.markers[Restaurant.googleRestaurants.length +i], 'mouseout', Gmap.closeInfoWindowSmall);
            google.maps.event.addListener(Restaurant.markers[Restaurant.googleRestaurants.length +i], 'click', Gmap.showInfoWindowMy);
            google.maps.event.addListener(Gmap.map, "click", Gmap.closeInfoWindow);

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

        console.log('Loading restaurant places .. ')
        console.log(Restaurant.myRestaurants)
    }

} 