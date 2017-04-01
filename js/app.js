var app = angular.module('droneApp', []).controller('droneCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
	var container = document.getElementById('popup');
	var content = document.getElementById('popup-content');
	var closer = document.getElementById('popup-closer');
	app.config(function($sceDelegateProvider) {
		$sceDelegateProvider.resourceUrlWhitelist([ 'self',
			'https://www.youtube.com/**' ]);
	});
	
    $scope.videoFilter = {
            search: ''
          };
	
	var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
		element: container,
		autoPan: true,
		autoPanAnimation: {
			duration: 250
		}
	}));
	
	$scope.filteredFusionData;
	$scope.filterMap = function(){
		setTimeout(function(){ 
			$scope.features = [];
			angular.forEach($scope.filteredFusionData, function(value, key) {
				$scope.features.push(new ol.Feature({
					geometry : new ol.geom.Point(
						ol.proj.transform($scope.getLatLonAsArray(value[1]), 'EPSG:4326','EPSG:3857')),
					youtube_id:value[2],
					descr:value[3]}));
			});
	    	$scope.videoMapSource.clear();
	    	$scope.videoMapSource.addFeatures($scope.features);
		}, 2000);
		
	}

	closer.onclick = function() {
		$scope.closePopup();
	};

	$scope.closePopup = function()
	{
		overlay.setPosition(undefined);
		closer.blur();
		return false;
	}

	//for angular to trust youtube url
	$scope.getIframeSrc = function(src) {
		return $sce.trustAsResourceUrl("https://www.youtube.com/embed/"
			+ src);
	};
	
	$scope.view = new ol.View({
		center : ol.proj.transform([ 32.9, 39.9 ], 'EPSG:4326', 'EPSG:3857'),
		zoom : 10
	});
	
	$scope.map = new ol.Map({
        interactions: ol.interaction.defaults().extend([
            new ol.interaction.DragRotateAndZoom()
          ]),
		target : 'map',
		layers : [new ol.layer.Tile({
            source: new ol.source.Stamen({
                layer: 'terrain'
              })
            })],
		view : $scope.view,
		overlays: [overlay]
	});
	
	$scope.videoLayer = null;
	$scope.videoMapSource = null;
	$scope.features = [];
	$scope.fusionData = [];
	new ol.source.Vector({
		features: null
	});
	var allFusionData = [];
	
	$http.get("https://www.googleapis.com/fusiontables/v1/query?sql=SELECT * FROM 1MIt8HjHPRe4_rifTaAwpK72vJ6c-oJdoa5c8Ryd7&key=AIzaSyCrjxOUtz0PEtDh9tDn6sjzObkC9dqQ1oA")
	.then(function(response) {
		$scope.fusionData = response.data.rows;
		allFusionData = response.data.rows;
		angular.forEach($scope.fusionData, function(value, key) {
			$scope.features.push(new ol.Feature({
				geometry : new ol.geom.Point(
					ol.proj.transform($scope.getLatLonAsArray(value[1]), 'EPSG:4326','EPSG:3857')),
				youtube_id:value[2],
				descr:value[3]}));
		});

		$scope.videoMapSource = new ol.source.Vector({
			features: $scope.features
		});

		$scope.videoLayer = new ol.layer.Vector({
			source: $scope.videoMapSource,
			style: new ol.style.Style({
				image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
					src: 'img/videoIcon.png'
				}))
			})
		});
		$scope.map.addLayer($scope.videoLayer);
		
		$scope.map.getView().fit($scope.videoLayer.getSource().getExtent(), $scope.map.getSize());
	});
	
	var element = document.getElementById('popup');

	//used on zooming selected point
    function elastic(t) {
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
      }
    
    $scope.zoomToVideo = function(argCoordinate)
    {
    	$scope.view.animate({
            center: ol.proj.fromLonLat($scope.getLatLonAsArray(argCoordinate)),
            duration: 2000,
            easing: elastic
          });
    }
    
    //openlayers works just with float values
    $scope.getLatLonAsArray = function(argLonLatStr)
    {
    	var latLon = argLonLatStr.split(",");
    	return [parseFloat(latLon[1]),parseFloat(latLon[0])];
    }
	
	$scope.map.on('click', function(evt) {
		var feature = $scope.map.forEachFeatureAtPixel(evt.pixel,
			function(feature) {
				return feature;
			});
		if (feature) {
			content.innerHTML = feature.get('descr') + "<iframe width='350' height='250' src='https://www.youtube.com/embed/" + feature.get('youtube_id') + "' frameborder='0' allowfullscreen></iframe>";
			overlay.setPosition(evt.coordinate);
		}
		else{
			$scope.closePopup();
		}
	});

    $scope.map.on('moveend', function onMoveEnd(evt) {
//    	if($scope.videoMapSource)
//    		{
//    		$scope.features = [];
//        	$scope.videoMapSource.clear();
//        	$scope.videoMapSource.addFeatures($scope.features);
//    		}

        var map = evt.map;
        var extent = map.getView().calculateExtent(map.getSize());
        var bottomLeft = ol.proj.transform(ol.extent.getBottomLeft(extent),
            'EPSG:3857', 'EPSG:4326');
        var topRight = ol.proj.transform(ol.extent.getTopRight(extent),
            'EPSG:3857', 'EPSG:4326');
        console.log(bottomLeft + " - " + topRight);
        
        $scope.fusionData = [];
    	
		angular.forEach(allFusionData, function(value, key) {
	    	var lonLat = $scope.getLatLonAsArray(value[1]);
	    	if(lonLat[0] > bottomLeft[0] && lonLat[0] < topRight[0] &&
	    			lonLat[1] > bottomLeft[1] && lonLat[1] < topRight[1])
	    		{
	    			$scope.fusionData.push(value);
	    		}
		});
		
    	$scope.$apply();
      });
}]);