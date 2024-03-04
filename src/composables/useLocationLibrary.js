
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

    return { mapResolutionToZoom, mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON };
}


