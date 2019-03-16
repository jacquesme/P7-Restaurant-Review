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
            Restaurant.markers[Restaurant.myRestaurants.length +i] = new google.maps.Marker({
                position: Restaurant.myRestaurants[i].geometry.location,
                placeId: Restaurant.myRestaurants[i].id,
                icon: Gmap.createMarker(Restaurant.myRestaurants[i]),
                zIndex: 52,
                id: Restaurant.myRestaurants[i].id,
            });

            Gmap.addRightHandResults(Restaurant.myRestaurants[i]);

        }

        console.log('Loading restaurant places .. ')
        console.log(Restaurant.myRestaurants)
    }

} 