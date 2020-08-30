// initialize and center map on Singapore with specified zoom level
const foodMap = L.map('mapid').setView([1.3521, 103.8198], 13);
const allMarkers = [];
let stations;
let locations;

// add map tiles from OpenStreetMap provided by Mapbox
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiaG9uZ2ppbjg2IiwiYSI6ImNqc2ZtbWd4MjB1N2szeW5zdnJudDFrb3UifQ.7oN1vxDQ7-C85Qq1ZsSKEQ'
}).addTo(foodMap);

// create station icon using Fontawesome
const stationIcon = L.divIcon({
    html: '<i class="fas fa-subway fa-3x text-red-600"></i>',
    iconSize: [20, 20],
    className: 'myDivIcon',
    popupAnchor: [0,-20],
    iconAnchor: [10, 10]
});
// Alternative icon for station using MakiMarker
// const stationIcon = L.MakiMarkers.icon({icon: "rail", color: "#e53e3e", size: "m"});

// Create location icon using MakiMarker
L.MakiMarkers.accessToken = 'pk.eyJ1IjoiaG9uZ2ppbjg2IiwiYSI6ImNqc2ZtbWd4MjB1N2szeW5zdnJudDFrb3UifQ.7oN1vxDQ7-C85Qq1ZsSKEQ';
const locationIcon = L.MakiMarkers.icon({icon: "restaurant", color: "#ed8936", size: "m"});

// populate location markers on map
fetch("./locations.json")
  .then(res => res.json())
  .then(data => {
  locations = data;
  locations.forEach(location => {
    let marker = L.marker([location.Long, location.Lat], {icon: locationIcon}).addTo(foodMap).on('click', zoomToMarker);
    marker.bindPopup(`
      <div class="text-gray-700">
        <h1 class="text-lg font-bold text-red-500">${location['Restaurant Name En']} ${location['Restaurant Name Cn']}</h1>
        <h3><i class="fas fa-building mr-2 text-orange-500"></i>${location['Location']} ${location['Shopping Mall'] && '• ' + location['Shopping Mall']}</h3>
        <h3><i class="fas fa-map-marker-alt mr-2 text-orange-500"></i>${location['Address']}</h3>
        <h3><i class="far fa-clock mr-2 text-orange-500"></i>${location['Opening Hours']}</h3>
        <h3><i class="fas fa-utensils mr-2 text-orange-500"></i>${location['Food Type']}</h3>
        <div class="mt-2">
          <img class="object-contain h-48 w-full" src=${location['Desktop Image URL']}>
        </div>
        <p class="text-base">${location['Description']}</p1>
      </div>
    `);
    allMarkers.push(marker);
  });
    return fetch("./stations.json");
  })
  .then(res => res.json())
  .then(data => {
  stations = data;
  // populate all station markers on map
  stations.forEach(station => {
    let marker = L.marker([station.Long, station.Lat], { icon: stationIcon}).addTo(foodMap).on('click', zoomToMarker);
    marker.bindPopup(`
      ${station['MRT En']}
      ${station['MRT Cn']}
    `);
    allMarkers.push(marker);
    stations.push(station);
  });
  
  // fit map to show all markers
  const group = new L.featureGroup(allMarkers);
  foodMap.fitBounds(group.getBounds());  
  })
  .catch(error => {
    console.log(error)
  });

// zoom to any marker
function zoomToMarker(e)
{
  const markerlatLng = e.target.getLatLng();
  recenter(markerlatLng, 0, 100);
}


// zoom to station marker and show all surrounding location markers
function zoomToStation(e) {
    foodMap.closePopup();
    const selectedStation = document.getElementById("stations").value;
    const selectedStationCn = e.options[e.selectedIndex].getAttribute('data-cn');
    const station = stations.filter(station => station['MRT En'] === selectedStation);
    if (station) {
      const lat = station[0]["Lat"];
      const lng = station[0]["Long"];
      const latLngs = [new L.LatLng(lng, lat)];
      
      const nearbyLocations = locations.filter(location => location['Location'] === selectedStationCn);
      nearbyLocations.forEach(location => {
        latLngs.push(new L.LatLng(location["Long"], location["Lat"]));
      });
      
      const markerBounds = L.latLngBounds(latLngs);
      foodMap.fitBounds(markerBounds, {padding: [50,50]});
    }
}

// reset map view and dropdown selection
function resetMap() {
  const group = new L.featureGroup(allMarkers);
  foodMap.fitBounds(group.getBounds());
  document.getElementById("stations").value = "default";
  foodMap.closePopup();
}

function recenter(latLng, offsetx,offsety) {
      let center = foodMap.project(latLng);
      center = new L.point(center.x+offsetx,center.y+offsety);
      const target = foodMap.unproject(center);
      foodMap.panTo(target);
}
