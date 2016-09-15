var MAP = {};

/**
 * Ol3 map
 */
MAP.ol3Map = function () {
  var KEY = 'vector-tiles-LM25tq4';
  var ATTRIBUTION = '© <a href="https://mapzen.com/">Mapzen</a> ' +
      '© <a href="http://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>';
  var _places = [];
  var _layer = new ol.layer.VectorTile({
    projection: "EPSG:4326",
    source: new ol.source.VectorTile({
      attributions: [new ol.Attribution({html: ATTRIBUTION})],
      format: new ol.format.GeoJSON(),
      tileGrid: ol.tilegrid.createXYZ({maxZoom: 16, tileSize: [256, 256]}),
      url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.json?api_key=' + KEY,
      tileLoadFunction: tileLoadFunction
    }),
    style: createOl3Style()
  });

  new ol.Map({
    layers: [_layer],
    target: 'map',
    view: new ol.View({
      center: ol.proj.transform([-73.99, 40.75], 'EPSG:4326', 'EPSG:3857'),
      zoom: 13,
      maxZoom: 16
    })
  });

  function tileLoadFunction(tile, url) {
    tile.setLoader(function () {
      $.get(url, function (data) {
        var json = data;
        var format = tile.getFormat();
        var all = [];

        var water = format.readFeatures(json.water);
        water.forEach(function (el) {
          el.set('layer', 'water');
          all.push(el);
        });

        var _placesInTile = format.readFeatures(json.places);
        var _tile = tile.getTileCoord();
        _places[_tile] = [];
        _placesInTile.forEach(function (el) {
          el.set('layer', 'place_label');
          _places[_tile].push(el);
        });

        var roads = format.readFeatures(json.roads);
        roads.forEach(function (el) {
          el.set('layer', 'road');
          all.push(el);
        });

        var landuse = format.readFeatures(json.landuse);
        landuse.forEach(function (el) {
          el.set('layer', 'landuse');
          all.push(el);
        });

        var building = format.readFeatures(json.landuse);
        building.forEach(function (el) {
          el.set('layer', 'buildings');
          all.push(el);
        });

        tile.setFeatures(all);

        tile.setProjection(ol.proj.get("EPSG:4326"));
      });
    });
  }

  function createOl3Style() {
    var fill = new ol.style.Fill({color: ''});
    var stroke = new ol.style.Stroke({color: '', width: 1});
    var polygon = new ol.style.Style({fill: fill});
    var line = new ol.style.Style({stroke: stroke});

    var styles = [];
    return function (feature, resolution) {
      //console.log('=============>>> feature', feature,resolution);
      var length = 0;
      var layer = feature.get('layer');
      var kind = feature.get('kind');
      var geom = feature.getGeometry().getType();
      //console.log(layer, kind, geom);

      //water 
      if ((layer === 'water' && kind === 'water-layer')
          || (layer === 'water' && kind === 'river')
          || (layer === 'water' && kind === 'stream')
          || (layer === 'water' && kind === 'canal')) {
        stroke.setColor('#9DD9D2');
        stroke.setWidth(1.5);
        styles[length++] = line;
      } else if ((layer === 'water' && kind === 'riverbank')) {
        fill.setColor('#9DD9D2');
        stroke.setWidth(1.5);
        styles[length++] = polygon;
      } else if ((layer === 'water' && kind === 'water_boundary')
          || (layer === 'water' && kind === 'ocean_boundary')
          || (layer === 'water' && kind === 'riverbank_boundary')) {
        stroke.setColor('#93cbc4');
        stroke.setWidth(0.5);
        styles[length++] = line;
      } else if (layer === 'water' || layer === 'ocean') {
        fill.setColor('#9DD9D2');
        styles[length++] = polygon;
      } else if (layer === 'aeroway' && geom === 'Polygon') {
        fill.setColor('#9DD9D2');
        styles[length++] = polygon;
      } else if (layer === 'aeroway' && geom === 'LineString' &&
          resolution <= 76.43702828517625) {
        stroke.setColor('#f0ede9');
        stroke.setWidth(1);
        styles[length++] = line;
      }

      //parks
      else if ((layer === 'landuse' && kind === 'park')
          || (layer === 'landuse' && kind === 'nature_reserve')
          || (layer === 'landuse' && kind === 'wood')
          || (layer === 'landuse' && kind === 'protected_land')) {
        fill.setColor('#88D18A');
        styles[length++] = polygon;
      } else if (layer === 'landuse' && kind === 'hospital') {
        fill.setColor('#fde');
        styles[length++] = polygon;
      }
      else if (layer === 'landuse' && kind === 'school') {
        fill.setColor('#f0e8f8');
        styles[length++] = polygon;
      }

      //roads
      else if ((resolution > 3 && layer === 'road' && kind === 'major_road')) {
        stroke.setColor('#fb7b7a');
        stroke.setWidth(1);
        styles[length++] = line;
      }
      else if ((resolution > 3 && layer === 'road' && kind === 'minor_road')) {
        stroke.setColor('#999');
        stroke.setWidth(0.5);
        styles[length++] = line;
      }
      else if ((resolution > 3 && layer === 'road' && kind === 'highway')) {
        stroke.setColor('#FA4A48');
        stroke.setWidth(1.5);
        styles[length++] = line;
      }

      else if ((layer === 'transit' && kind === 'rail')) {
        stroke.setColor('#503D3F');
        stroke.setWidth(0.5);
        styles[length++] = line;
      }

      //building
      else if ((resolution < 3 && layer === 'buildings')) {
        stroke.setColor('#987284');
        stroke.setWidth(0.15);
        styles[length++] = line;
      }

      styles.length = length;
      return styles;
    };
  }
}();

