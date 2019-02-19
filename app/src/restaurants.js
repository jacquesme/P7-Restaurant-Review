var Restaurant = {

    markers: [],
    newMarkers: [],
    placeId: null,
    googleRestaurants: [],
    myRestaurants: [],
    
    loadRestaurants: function () {
        Gmap.request.open('GET', 'http://localhost:3000/results', true);
        Gmap.request.onload = Restaurant.getPlaces;
        Gmap.request.send(null);
    },

    getPlaces: function () {
        Restaurant.myRestaurants = JSON.parse(Gmap.request.responseText);

        for(var i = 0; i < Restaurant.myRestaurants.length; i ++) {
            Restaurant.myRestaurants.forEach(function (results, i) {
                Restaurant.myRestaurants[i] = results;
                Gmap.createMarker(Restaurant.myRestaurants[i].geometry.location.lat, Restaurant.myRestaurants[i].geometry.location.lng);
            })
            Gmap.addResultList(Restaurant.myRestaurants[i]);
        };

        console.log('Loading restaurant places .. ')
        console.log(Restaurant.myRestaurants);
    },
    
} 