(function($) {
        
    $.fn.regionEditor = function(options) {
        var map,
            drawingManager,
            mapContextMenu,
            polygonContextMenu,
            selectedPolygon, // The polygon that the user selected for editing meta-data
            modal,
            modalTitle,
            modalBody,
            editPolygonMenu,
            escButtonPushed,
            menuSelected,
            defaultPolygonOptions = {
                fillColor: '#ff0000',
                fillOpacity: 0.35,
                strokeWeight: 2,
                clickable: true,
                editable: false,
            };
            
        this.getMap = function() {
            return map;
        };

        return this.each(function(index, element) {
            var settings = $.extend({
                regionsListUrl: '/administration/regioneditor/list',
                regionModifyUrl: '/administration/regioneditor/modify',
                regionDeleteUrl: '/administration/regioneditor/delete',
                regionGetUrl: '/administration/regioneditor/get/id',
                regionUpdateCoordUrl: '/administration/regioneditor/updateCoordinates/id'
            }, options);

            function initialize() {
                if (!checkOptions()) {
                    return;
                }
                
                map = new google.maps.Map(element, settings.mapOptions);                
                createDrawingManager();
                createMapContextMenu();
                createPolygonContextMenu();
                initListeners();

                drawDialogs();
                drawExistingRegions();            
            }

            function checkOptions() {
                if (settings.mapOptions == undefined) {
                    console.log('mapOptions option is required');
                    return false;
                }
                
                if (typeof ContextMenu == 'undefined') {
                    console.log('The ContextMenu dependency is not loaded');
                    return false;
                }
                
                return true;
            }

            function createDrawingManager() {
                drawingManager = new google.maps.drawing.DrawingManager({
                    drawingControl: true,
                    zIndex: 100,
                    drawingControlOptions: {
                        position: google.maps.ControlPosition.TOP_LEFT,
                        drawingModes: []
                    },
                    defaultPolygonOptions: defaultPolygonOptions
                });
                drawingManager.setMap(map);
            }

            function createMapContextMenu() {
                // Create the ContextMenu object
                mapContextMenu = new ContextMenu(map, {
                    classNames: {menu: 'context_menu', menuSeparator: 'context_menu_separator'},
                    menuItems: [
                        {className: 'context_menu_item', eventName: 'create_new_polygon', label: 'Създаване на регион'},
                    ]
                });

                google.maps.event.addListener(mapContextMenu, 'menu_item_selected', function(latLng, eventName){
                    setMenuSelected(true);
                    mapContextMenu.hide();

                    switch(eventName){
                        case 'create_new_polygon':
                            drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                            break;
                    }
                });
            }

            function createPolygonContextMenu() {
                polygonContextMenu = new ContextMenu(map, {
                    classNames: {menu: 'context_menu', menuSeparator: 'context_menu_separator'},
                    menuItems: [
                        {className: 'context_menu_item', eventName: 'edit_polygon', label: 'Редакция на контура'},
                        {className: 'context_menu_item', eventName: 'delete_region', label: 'Изтриване на региона'},
                    ]
                });

                google.maps.event.addListener(polygonContextMenu, 'menu_item_selected', function(latLng, eventName){
                    setMenuSelected(true);
                    polygonContextMenu.hide();

                    switch(eventName){
                        case 'edit_polygon':
                            editPolygonMenu.slideDown();
                            selectedPolygon.setEditable(true);
                            break;
                        case 'delete_region':
                            if (confirm('Сигурни ли сте, че искате да изтриете този регион?')) {
                                if (!selectedPolygon.get('id')) {
                                    selectedPolygon.setMap(null);
                                    modal.modal('hide');

                                    return;
                                }

                                $.get(settings.regionDeleteUrl, {id: selectedPolygon.get('id')}, function(response) {
                                    if (response.success) {
                                        selectedPolygon.setMap(null);
                                        modal.modal('hide');
                                    }
                                }, 'json');
                            }
                            break;
                    }
                });
            }

            function initListeners() {
                // Stop drawing if you click the 'esc' button
                google.maps.event.addDomListener(document, 'keyup', function (e) {
                    var code = (e.keyCode ? e.keyCode : e.which);
                    if (code === 27) {
                        setEscBtnPushed(true);
                        drawingManager.setDrawingMode(null);
                    }
                });

                // Stop drawing if you click the right mouse button. Google maps will close the polygon automaticaly
                map.addListener('rightclick', function(mouseEvent) {
                    mapContextMenu.show(mouseEvent.latLng);
                    polygonContextMenu.hide();
                });

                google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
                    if (isEscBtnPushed()) {
                        setEscBtnPushed(false);
                        polygon.setMap(null);

                        return;
                    }

                    var paths = polygon.getPaths().getAt(0),
                        pathsLen = paths.length;

                    if (pathsLen <= 2) { // Only one or two points == no polygon
                        polygon.setMap(null);
                        return;
                    }

                    setCommonListeners(polygon);
                    // Edit the polygon right after you finished drawing it
                    setMenuSelected(false);
                    manageRegionData(polygon);
                });
            }

            function drawExistingRegions() {
                $.get(settings.regionsListUrl, function(response) {
                    if (response.success) {
                        for (var index in response.regions) {
                            drawRegion(response.regions[index]);
                        }
                    }
                }, 'json');
            }

            function drawRegion(region) {
                var options = $.extend({}, defaultPolygonOptions);

                options.paths = JSON.parse(region.coordinates);
                options.fillColor = options.strokeColor = region.color;

                var polygon = new google.maps.Polygon(options);
                polygon.set('id', region.id);
                setCommonListeners(polygon);

                polygon.setMap(map);
            }

            function drawDialogs() {
                drawEditRegionModal();
                drawEditPolygonMenu();
            }
            
            function drawEditRegionModal() {
                modalTitle = $('<h3 />');
                modalBody = $('<div />')
                    .attr('class', 'modal-body');
                
                var dismissBtn = $('<button />')
                        .attr('type', 'button')
                        .attr('class', 'close')
                        .attr('data-dismiss', 'modal')
                        .attr('aria-hidden', 'true')
                        .html('&times;'),
                    modalHeader = $('<div />')
                        .attr('class', 'modal-header')
                        .append(modalTitle)
                        .append(dismissBtn),
                    saveBtn = $('<a />')
                        .attr('href', '#')
                        .attr('class', 'btn btn-primary')
                        .attr('id', 'save-region-btn-' + index)
                        .text('Запазване'),
                    closeBtn = $('<button />')
                        .attr('href', '#')
                        .attr('type', 'button')
                        .attr('data-dismiss', 'modal')
                        .attr('class', 'btn')
                        .text('Отказ'),
                    modalFooter = $('<div />')
                        .attr('class', 'modal-footer')
                        .append(saveBtn)
                        .append(closeBtn);
                
                modal = $('<div />')
                    .attr('id', 'manage-region-data-modal-' + index)
                    .attr('class', 'modal hide fade')
                    .append(modalHeader)
                    .append(modalBody)
                    .append(modalFooter)
                    .appendTo('body');
            
                saveBtn.on('click', function() {
                    var form = $('#region-editor-form');

                    setSelectedPolygonCoordinates();
                    $.post(form.attr('action'), form.serialize(), function(response) {
                        if (response.success) {
                            var options = $.extend({}, defaultPolygonOptions);
                            options.strokeColor = options.fillColor = $('#NetRegion_color').val();

                            selectedPolygon.set('id', response.id);
                            selectedPolygon.setOptions(options);

                            form.trigger("reset");

                            drawingManager.setDrawingMode(null);
                            modal.modal('hide');

                            return;
                        }

                        modalBody.html(response.html);
                    }, 'json');
                });

                modal.on('hide', function() {
                    drawingManager.setDrawingMode(null);
                    if (!selectedPolygon.get('id')) {
                        selectedPolygon.setMap(null);
                    }
                });
            }
            
            function drawEditPolygonMenu() {
                var saveLink = $('<a />')
                        .attr('href', '#')
                        .attr('class', 'btn btn-primary')
                        .attr('id', 'update-region-coordinates-btn-' + index)
                        .text('Запазване'),
                    closeLink = $('<a />')
                        .attr('href', '#')
                        .attr('class', 'btn')
                        .attr('style', 'float: right')
                        .attr('id', 'close-edit-polygon-menu-btn-' + index)
                        .html('&times;');
                
                editPolygonMenu = $('<div />')
                        .attr('id', 'edit-polygon-menu-' + index)
                        .append(saveLink)
                        .append(closeLink);
                    
                saveLink.on('click', function() {
                    $.post(settings.regionUpdateCoordUrl + '/' + selectedPolygon.get('id'), {coordinates: getSelectedPolygonCoordinates()}, function(response) {
                        if (response.success) {
                            selectedPolygon.setEditable(false);
                            editPolygonMenu.slideUp();
                        }
                    }, 'json');
                });

                closeLink.on('click', function() {
                    $.get(settings.regionGetUrl  + '/' + selectedPolygon.get('id'), function(response) {
                        if (response.success) {
                            selectedPolygon.setPaths(JSON.parse(response.region.coordinates));
                            selectedPolygon.setEditable(false);
                            selectedPolygon = null;

                            editPolygonMenu.slideUp();
                        }
                    }, 'json');
                });
                    
                editPolygonMenu.appendTo('body');
            }

            function manageRegionData(polygon) {
                if (isMenuSelected()) {
                    setMenuSelected(false);
                    return;
                }

                selectedPolygon = polygon;
                var regionId = selectedPolygon.get('id');
                $.get(settings.regionModifyUrl, {id: regionId}, function(response) {
                    if (response.success) {
                        modalBody.html(response.html);

                        if (regionId) {
                            modalTitle.text('Редактиране на регион');
                        } else {
                            modalTitle.text('Създаване на регион');
                        }

                        modal.modal('show');
                    }
                }, 'json');
            }

            function setCommonListeners(polygon) {        
                polygon.addListener('click', function() {            
                    manageRegionData(this);
                });
                polygon.addListener('mouseover', function() {
                    this.setOptions({strokeColor: '#ffffff'});
                });
                polygon.addListener('mouseout', function() {
                    this.setOptions({strokeColor: this.fillColor});
                });
                polygon.addListener('rightclick', function(mouseEvent) {
                    selectedPolygon = this;            

                    polygonContextMenu.show(mouseEvent.latLng);
                    mapContextMenu.hide();
                });
            }

            function setEscBtnPushed(value) {
                escButtonPushed = value;
            }

            function isEscBtnPushed() {
                return escButtonPushed;
            }

            function setMenuSelected(value) {
                menuSelected = value;
            }

            function isMenuSelected() {
                return menuSelected;
            }

            function getSelectedPolygonCoordinates() {
                var coordinates = [],
                    firstCoord,
                    paths = selectedPolygon.getPaths().getAt(0);

                paths.forEach(function(element, index) {
                    var currentCoord = {lat: element.lat(), lng: element.lng()};
                    if (index == 0) {
                        firstCoord = currentCoord;
                    }

                    coordinates.push(currentCoord);
                });

                // Close the polygon by connecting it to the first point
                coordinates.push(firstCoord);

                return JSON.stringify(coordinates);
            }

            /**
             * Fetches the coordinates of the selected polygon and fills the form field coordinate's value.
             */
            function setSelectedPolygonCoordinates() {
                $('#NetRegion_coordinates').val(getSelectedPolygonCoordinates());
            }
            
            initialize();
        });
        
    }
        
})(jQuery);

