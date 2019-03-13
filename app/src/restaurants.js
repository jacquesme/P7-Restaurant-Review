var Restaurant = {
    myRestaurantsPos: {},
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
        Restaurant.googleRestaurants = JSON.parse(Gmap.request.responseText);
        Restaurant.googleRestaurants.forEach(function (results, index) {
            Restaurant.googleRestaurants[index] = results;
            Gmap.createMarker(Restaurant.googleRestaurants[index].geometry.location.lat, Restaurant.googleRestaurants[index].geometry.location.lng);
            Gmap.addRightHandResults(Restaurant.googleRestaurants[index]);
        })

        //console.log('Loading restaurant places .. ')
        //console.log(Restaurant.googleRestaurants)
    }

} 