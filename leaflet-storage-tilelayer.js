
        'use strict';

        var StorageTileLayer = L.TileLayer.extend({
            _imageToDataUri: function (image) {
                var canvas = window.document.createElement('canvas');
                canvas.width = image.naturalWidth || image.width;
                canvas.height = image.naturalHeight || image.height;

                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                return canvas.toDataURL('image/png');
            },

            _tileOnLoadWithCache: function () {
                var storage = this._layer.options.storage;
                if (storage) {
                    storage.add(this._storageKey, this._layer._imageToDataUri(this));
                }
                L.TileLayer.prototype._tileOnLoad.apply(this, arguments);
            },

            _setUpTile: function (tile, key, value, cache) {
                tile._layer = this;
                if (cache) {
                    tile._storageKey = key;
                    tile.onload = this._tileOnLoadWithCache;
                    tile.crossOrigin = 'Anonymous';
                } else {
                    tile.onload = this._tileOnLoad;
                }
                tile.onerror = this._tileOnError;
                tile.src = value;
            },

            _loadTile: function (tile, tilePoint) {
                this._adjustTilePoint(tilePoint);
                var key = tilePoint.z + ',' + tilePoint.y + ',' + tilePoint.x;

                var self = this;
                if (this.options.storage) {
                    this.options.storage.get(key, function (value) {
                        if (value) {
                            self._setUpTile(tile, key, value, false);
                        } else {
                            self._setUpTile(tile, key, self.getTileUrl(tilePoint), true);
                        }
                    }, function () {
                        self._setUpTile(tile, key, self.getTileUrl(tilePoint), true);
                    });
                } else {
                    self._setUpTile(tile, key, self.getTileUrl(tilePoint), false);
                }
            }
        });


        Polymer('leaflet-storage-tilelayer', {
            observe: {
                'container storage': 'updateLayer'
            },
            updateLayer: function() {
                if (this.container && this.storage) {
                    var layer = new StorageTileLayer(this.url, {
                        attribution: this.innerHTML + this.attribution,
                        minZoom: this.minZoom,
                        maxZoom: this.maxZoom,
                        maxNativeZoom: this.maxNativeZoom,
                        tileSize: this.tileSize,
                        subdomains: this.subdomains,
                        errorTileUrl: this.errorTileUrl,
                        tms: this.tms,
                        continuousWorld: this.continuousWorld,
                        noWrap: this.noWrap,
                        zoomOffset: this.zoomOffset,
                        zoomReverse: this.zoomReverse,
                        opacity: this.opacity,
                        zIndex: this.zIndex,
                        detectRetina: this.detectRetina,
                        reuseTiles: this.reuseTiles,
                        storage: this.storage
                    });
                    this.layer = layer;

                    // forward events
                    layer.on('loading load tileloadstart tileload tileunload', function(e) {
                        this.fire(e.type, e);
                    }, this);
                    this.layer.addTo(this.container);
                }
            }
        });
    