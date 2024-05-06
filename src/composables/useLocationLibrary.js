export function useLocationLibrary() {
    

    // Function to map resolution to zoom level
    function mapResolutionToZoom(resolution) {
        switch (resolution) {
            case 0:
                return 16;
            case 1:
                return 12;
            case 2:
                return 7;
            case 3:
                return 5;
            case 4:
                return 3;
            case 5:
                return 0;
            default:
                return 10;
        }
    }


    function mapZoomToResolution(zoom) {
        let resolution = 0
        if (zoom < 3) {
            resolution = 4
        } else if (zoom < 7) {
                resolution = 3
            } else if (zoom < 9) {
                    resolution = 2
                } else if (zoom < 15) {
                        resolution = 1
                    } 
                    return resolution
    }



    function isValidCoordinateFormat(str) {
        // Regular expression for matching coordinates with at least one decimal digit
        const regex = /^-?\d+\.\d+, -?\d+\.\d+$/;
        return regex.test(str);
      }
      
      
      
      function isValidGeoJSON(str) {
        try {
          // Step 1: Attempt to parse the string as JSON
          const obj = JSON.parse(str);
      
          // Step 2: Verify that the parsed object adheres to the GeoJSON specification
          // Check for the existence of a "type" property
          if (!obj.type) {
            return false;
          }
      
          // Check if the "type" is one of the valid GeoJSON types
          const validTypes = ["FeatureCollection", "Feature", "Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"];
          if (!validTypes.includes(obj.type)) {
            return false;
          }
      
          // Further checks can be added here based on the GeoJSON specification requirements
          // for each type, such as checking for the existence and validity of the "features" array
          // in a FeatureCollection, the "geometry" object in a Feature, etc.
      
          // If the checks pass, the object is likely valid GeoJSON
          return true;
        } catch (e) {
          // The string could not be parsed as JSON
          return false;
        }
      }

// Function to perform reverse geocoding
function reverseGeocode(geoJsonFeature, site) {
    //, "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude], "type": "Point" }
    console.warn(`go reverse geocode`)
    const longitude = geoJsonFeature.geometry.coordinates[0];
    const latitude = geoJsonFeature.geometry.coordinates[1];
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Location details:', data);
        // Here you can extract and use the country, state, city, etc.
        console.log(`Country: ${data.tourism}, ${data.name} ${data.address.country}, State: ${data.address.state}, City: ${data.address.village || data.address.city || data.address.town}`);
        geoJsonFeature.properties.name = data.tourism || data.name || data.address.city || data.address.town
        geoJsonFeature.properties.city = data.address.village || data.address.city || data.address.town
        geoJsonFeature.properties.country = data.address.country
        site.address = data.display_name
        site.country = data.address.country
        site.street = data.address.street ||data.address.road
        site.state = data.address.state
        site.county = data.address.county
        site.city = (data.address.village || data.address.city || data.address.town)
        if (data.address.suburb) site.city = data.address.suburb+',' + site.city
        if (!site.label || site.label=='To be geo-encoded') {
        site.label = data.tourism||data.amenity  || data.name 
        }
        if (!site.label) {site.label = site.street}
        // console.log(`sites ${JSON.stringify(currentStory.value.sites)}`)
      })
      .catch(error => console.error('Error:', error));
  }

  
  
  

    return { mapResolutionToZoom, mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON, reverseGeocode };
}


