# innologica-region-editor

Provides a tool for drawing regions on one or multiple Google maps.

## Dependencies

* jQuery >= v1.11.1
* Bootstrap v2
* GoogleMaps v3
* ContextMenu (in the package)

## Basic Usage

First load the dependencies. When loading google maps, be sure to load the drawing library as well like this:

    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?libraries=drawing&language=bg-BG"></script>

Then add container for the map:

    <div class="span12 map"></div>

You may add multiple containers if you need more than one map.
Add google DOM listener to be sure that your code will be invoked after google maps is loaded:

    google.maps.event.addDomListener(window, 'load', callback);

Then initialize the plugin by passing it options for the Google map:

    $('.map').regionEditor({
        mapOptions: {
            center: new google.maps.LatLng(42.681457, 23.357626),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DEFAULT,
                position: google.maps.ControlPosition.TOP_RIGHT
            }
        }
    });

Full example:

    <head>
        ...

        <link rel="stylesheet" type="text/css" href="/css/innologica-region-editor/region-editor.css" />

        <script type="text/javascript" src="/js/jquery.js"></script>
        <script type="text/javascript" src="/js/bootstrap.js"></script>
        <script type="text/javascript" src="//maps.googleapis.com/maps/api/js?libraries=drawing&language=bg-BG"></script>
        <script type="text/javascript" src="/js/innologica-region-editor/region-editor.js"></script>        
        
        ...
    </head>
    <body>
        <div class="span12 map"></div>

        <script type="text/javascript">
            google.maps.event.addDomListener(window, 'load', function() {
                $('.map').regionEditor({
                    mapOptions: {
                        center: new google.maps.LatLng(42.681457, 23.357626),
                        zoom: 13,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        mapTypeControlOptions: {
                            style: google.maps.MapTypeControlStyle.DEFAULT,
                            position: google.maps.ControlPosition.TOP_RIGHT
                        }
                    }
                });
            });
        </script>
    <body>

## Options

#### `mapOptions`

The Google map's [options] (https://developers.google.com/maps/documentation/javascript/reference?hl=en#MapOptions)

#### ```regionsListUrl```

The URL where the list of existing regions is fetched from. Default value: 

`/administration/regioneditor/list`

Sample result:

    {
        success: 1, 
        regions: [
            {id: "1", name: "Studentski Grad", color: "#ff0000", coordinates: "[{"lat":42.71299792159186,"lng":23.237500190734863},{"lat":42.71006532890601,"lng":23.240461349487305}...]"}
            {id: "2", name: "Mladost 3", color: "#ff0000", coordinates: "[{"lat":42.71299792159186,"lng":23.237500190734863},{"lat":42.71006532890601,"lng":23.240461349487305}...]"}
        ]
    }

#### ```regionModifyUrl```

The URL used for creating or updating a region. Default value: 

`/administration/regioneditor/modify`

Sample request (Form data):

    NetRegion[name]:"Slatina"
    NetRegion[color]:"#ff00ff"
    NetRegion[coordinates]:"[{"lat":42.680668683402054,"lng":23.361740112304688},{"lat":42.67271784429404,"lng":23.38611602783203}...]"

Sample result:

    {
        id: "20",
        success: 1
    }
    
#### ```regionDeleteUrl```

The URL used for deleting a region. Default value: 

`/administration/regioneditor/delete`

Sample result:

    {
        success: 1
    }
        
#### ```regionGetUrl```

The URL used for getting a single region. Default value: 

`/administration/regioneditor/get/id`

Sample result:

    {
        success: 1
        region: {id: "1", name: "Studentski Grad", color: "#ff0000", coordinates: "[{"lat":42.71299792159186,"lng":23.237500190734863},{"lat":42.71006532890601,"lng":23.240461349487305}...]"}
    }
    
#### ```regionUpdateCoordUrl```

The URL used for updating the coordinates of a region. Default value: 

`/administration/regioneditor/updateCoordinates/id`

Sample result:

    {
        success: 1
    }

## Methods

#### ```getMap()```

Returns the google.maps.Map object.

## Author

**Nikolay Traykov (<ntraykov@innologica.com>)**
