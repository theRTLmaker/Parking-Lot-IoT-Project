var parkingSpotControllers = angular.module('reservationControllers', []);

parkingSpotControllers.controller('ReservationCtrl', [
    '$scope',
    '$http',
    '$location',
    'lwResources',
    'parkingSpotServices',
    function ParkingSpotListCtrl($scope, $http,$location, lwResources, parkingSpotServices) {
        // update navbar
        angular.element("#navbar").children().removeClass('active');
        angular.element("#parking-spot-navlink").addClass('active');

        

        
        // free resource when controller is destroyed
        $scope.$on('$destroy', function(){
            if ($scope.eventsource){
                $scope.eventsource.close()
            }
        });
        
        // add function to show parking-spot
        $scope.showParkingSpot = function(parkingSpot) {
            $location.path('/parking-spots/' + parkingSpot.endpoint);
        };
        
        $scope.numParkingSpots = function(state) {
            var ret = 0;
            $scope.parkingSpots.forEach(function(ps){
                if (ps !== undefined && ps.state == state) {
                    ret++;
                }
            });
            return(ret);
        }

        $scope.reserveFunction = function(endpoint, duration, plate) {
            console.log(endpoint);
            console.log(duration);
            console.log(plate);

            $.ajax({
                    url: "/api/reservation",    //Your api url
                    type: 'PUT',   //type is any HTTP method
                    data: {
                        endpoint, duration, plate
                    },
                    dataType: "json"      //Data as js object
            });
            alert("Reserved!!!!! :D");

        };
        
        $scope.showResults = function(){

            // get the list of connected clients
            $http.get('api/clients'). error(function(data, status, headers, config){
                $scope.error = "Unable get parking spot list: " + status + " " + data  
                console.error($scope.error)
            }).success(function(data, status, headers, config) {
                $scope.parkingSpots = data.map(function(ps){
                    parkingSpotServices.startObserving(ps);
                    return(parkingSpotServices.assignAttr(ps));
                });
                
                // HACK : we can not use ng-if="clients"
                // because of https://github.com/angular/angular.js/issues/3969
                $scope.reservationpage = true;
            
                // listen for clients registration/deregistration
                $scope.eventsource = new EventSource('event');
            
                var registerCallback = function(msg) {
                    $scope.$apply(function() {
                        var parkingSpot = JSON.parse(msg.data);
                        parkingSpot = parkingSpotServices.assignAttr(parkingSpot);
                        parkingSpotServices.startObserving(parkingSpot);
                        $scope.parkingSpots.push(parkingSpot);
                    });
                }
                $scope.eventsource.addEventListener('REGISTRATION', registerCallback, false);
            
                var getParkingSpotIdx = function(parkingSpot) {
                    for (var i = 0; i < $scope.parkingSpots.length; i++) {
                        if ($scope.parkingSpots[i].registrationId == parkingSpot.registrationId) {
                            return i;
                        }
                    }
                    return -1;
                }
                var deregisterCallback = function(msg) {
                    $scope.$apply(function() {
                        var parkingSpotIdx = getParkingSpotIdx(JSON.parse(msg.data));
                        if(parkingSpotIdx >= 0) {
                            $scope.parkingSpots.splice(parkingSpotIdx, 1);
                        }
                    });
                }
                $scope.eventsource.addEventListener('DEREGISTRATION', deregisterCallback, false);
                
                
                var notificationCallback = function(msg) {
                    parkingSpotServices.notificationCallback(msg, $scope);
                }
                $scope.eventsource.addEventListener('NOTIFICATION', notificationCallback, false);

            });
    };
}]);

parkingSpotControllers.controller('ParkingSpotDetailCtrl', [
    '$scope',
    '$location',
    '$routeParams',
    '$http',
    'lwResources',
    '$filter',
    'parkingSpotServices',
    function($scope, $location, $routeParams, $http, lwResources, $filter, parkingSpotServices) {
        // update navbar
        angular.element("#navbar").children().removeClass('active');
        angular.element("#parking-spot-navlink").addClass('active');
        $scope.parkingSpotEndpoint = $routeParams.parkingSpotEndpoint;
        
        var dateSelected = function(date) {
            $scope.date = new Date(date);
            var uriDate = $.datepicker.formatDate("yy-mm-dd", $scope.date);
            $http.get('api/bills/?parkingSpotId=' + $routeParams.parkingSpotId + '&date=' + uriDate)
            .error(function(data, status, headers, config) {  
                console.error("Unable get connect");
            })
            .success(function(data, status, headers, config) {
                var result = _(data).sortBy("time").groupBy("vehicleId").map(function(events, vid) {
                    var startTime = 0;
                    var amount = _.reduce(events, function(sum, e) {
                        if(e.action === "occupy") startTime = new Date(e.time).getTime();
                        if(e.action === "free") sum += (new Date(e.time).getTime() - startTime)/1000 * e.billingRate;
                        return sum;
                    }, 0);
                    return {vehicleId: vid, billingAmount: amount};
                }).value();
                $scope.bills = result;
            });
        }
        dateSelected(new Date());
        
        var datePicker = $("#datepicker").datepicker({
            onSelect: dateSelected
        });
    
        // free resource when controller is destroyed
        $scope.$on('$destroy', function(){
            if ($scope.eventsource){
                $scope.eventsource.close()
            }
        });
        
        // get parkingSpot details
        $http.get('api/clients' + $routeParams.parkingSpotEndpoint)
        .error(function(data, status, headers, config) {
            $scope.error = "Unable get parking spot " + $routeParams.parkingSpotEndpoint+" : "+ status + " " + data;  
            console.error($scope.error);
        })
        .success(function(data, status, headers, config) {
            $scope.parkingSpot = data;
            $scope.parkingspot = true;
            
            // update resource tree with parkingSpot details
            lwResources.buildResourceTree($scope.parkingSpot.rootPath, $scope.parkingSpot.objectLinks, function (objects){
                $scope.objects = objects;
                parkingSpotServices.assignAttr($scope.parkingSpot);
            });
        });
}]);


parkingSpotControllers.controller('BillsCtrl', [
    '$scope',
    '$location',
    '$routeParams',
    '$http',
    'lwResources',
    '$filter',
    'parkingSpotServices',
    function($scope, $location, $routeParams, $http, lwResources, $filter, parkingSpotServices) {
        // update navbar
        angular.element("#navbar").children().removeClass('active');
        angular.element("#bills-navlink").addClass('active');
        $scope.parkingSpotEndpoint = $routeParams.parkingSpotEndpoint;
        
        var dateSelected = function(date) {
            $scope.date = new Date(date);
            var uriDate = $.datepicker.formatDate("yy-mm-dd", $scope.date);
            console.log(uriDate);
            $http.get('api/bills/?date=' + uriDate)
            .error(function(data, status, headers, config) {  
                console.error("Unable get connect");
            })
            .success(function(data, status, headers, config) {
                var parkingSpots = _(data).groupBy("parkingSpotId").map(function(events, p) {
                    var pspot = {parkingSpotId: p};
                    pspot.bills = _(events).sortBy("time").groupBy("vehicleId").map(function(events, vid) {
                                      var startTime = 0;
                                      var amount = _.reduce(events, function(sum, e) {
                                          if(e.action === "occupy") startTime = new Date(e.time).getTime();
                                          if(e.action === "free") sum += (new Date(e.time).getTime() - startTime)/1000 * e.billingRate;
                                          return sum;
                                      }, 0);
                                      return {vehicleId: vid, billingAmount: amount};
                                  }).value();
                    return pspot;
                }).value();
                $scope.parkingSpots = parkingSpots;
            });
        }
        dateSelected(new Date());
        
        var datePicker = $("#datepicker").datepicker({
            onSelect: dateSelected
        });
    
        // free resource when controller is destroyed
        $scope.$on('$destroy', function(){
            if ($scope.eventsource){
                $scope.eventsource.close()
            }
        });
        
}]);

