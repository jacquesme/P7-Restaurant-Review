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
        //Restaurant.myRestaurants.forEach(function (results, index) {
            //Restaurant.myRestaurants[index] = results;
            //Gmap.createMarker(Restaurant.myRestaurants[index].geometry.location.lat, Restaurant.myRestaurants[index].geometry.location.lng);
            //Gmap.addRightHandResults(Restaurant.myRestaurants[index]);
        //})

        console.log('Loading restaurant places .. ')
        console.log(Restaurant.myRestaurants)
    }

} 