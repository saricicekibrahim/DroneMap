var app = angular.module('droneApp', []);
app.controller('droneCtrl', function($scope, $http, $sce) {
			//https://www.googleapis.com/fusiontables/v1/query?sql=SELECT * FROM 1MIt8HjHPRe4_rifTaAwpK72vJ6c-oJdoa5c8Ryd7 where descriptor like 'Ankara%25' limit 5&key=AIzaSyCrjxOUtz0PEtDh9tDn6sjzObkC9dqQ1oA
			var container = document.getElementById('popup');
			var content = document.getElementById('popup-content');
			var closer = document.getElementById('popup-closer');
			app.config(function($sceDelegateProvider) {
				$sceDelegateProvider.resourceUrlWhitelist([ 'self',
					'https://www.youtube.com/**' ]);
			});
			
			var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
				element: container,
				autoPan: true,
				autoPanAnimation: {
					duration: 250
				}
			}));

			closer.onclick = function() {
				$scope.closePopup();
			};

			$scope.closePopup = function()
			{
				overlay.setPosition(undefined);
				closer.blur();
				return false;
			}
			$scope.searchValue = "";

			$scope.getIframeSrc = function(src) {
				return $sce.trustAsResourceUrl("https://www.youtube.com/embed/"
					+ src);
			};

			$scope.myFunc = function() {

				$scope.fusionData = [

				];
			};
			
			$scope.map = new ol.Map({
				target : 'map',
				layers : [ new ol.layer.Tile({
					source : new ol.source.OSM()
				})],
				view : new ol.View({
					center : ol.proj.transform([ 32.9, 39.9 ], 'EPSG:4326',
						'EPSG:3857'),
					zoom : 10
				}),
				overlays: [overlay]
			});
			
			$http.get("https://www.googleapis.com/fusiontables/v1/query?sql=SELECT * FROM 1MIt8HjHPRe4_rifTaAwpK72vJ6c-oJdoa5c8Ryd7 limit 5&key=AIzaSyCrjxOUtz0PEtDh9tDn6sjzObkC9dqQ1oA")
			.then(function(response) {
				$scope.fusionData = response.data.rows;
				$scope.features = [];
				// 			$scope.fusionData = [
				// 				[ "1", "32.9, 39.9", "Q3YtHNH1duo", "Ankara Üniversitesi" ],
				// 				[ "2", "32.7, 39.8", "8ZuftjyKzoI", "Ankara sit." ] ];
				angular.forEach($scope.fusionData, function(value, key) {
					var latLon = value[1].split(",");
					$scope.features.push(new ol.Feature({
						geometry : new ol.geom.Point(
							ol.proj.transform([
								parseFloat(latLon[1]),
								parseFloat(latLon[0])
								], 'EPSG:4326','EPSG:3857')),
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
							anchor: [0.5, 46],
							anchorXUnits: 'fraction',
							anchorYUnits: 'pixels',
							src: 'img/videoIcon.png'
						}))
					})
				});
				$scope.map.addLayer($scope.videoLayer);

				});
			
			var element = document.getElementById('popup');

			$scope.map.on('click', function(evt) {
				var feature = $scope.map.forEachFeatureAtPixel(evt.pixel,
					function(feature) {
						return feature;
					});
				if (feature) {
					
					var coordinate = evt.coordinate;

					content.innerHTML = feature.get('descr') + "<iframe width='250' height='250' src='https://www.youtube.com/embed/" + feature.get('youtube_id') + "' frameborder='0' allowfullscreen></iframe>";
					overlay.setPosition(coordinate);
				}
				else{
					$scope.closePopup();
				}
			});
			
			//});
		});