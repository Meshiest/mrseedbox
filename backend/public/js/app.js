(function(){
  
  var app = angular.module('SeedboxApp', ['ngMaterial','ngRoute'])

  app.config(function ($routeProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('orange', {
        default: '800',
        "hue-1": '50'
      })
      .accentPalette('blue')

    $mdThemingProvider.theme('input', 'default')
      .primaryPalette('grey')

    $routeProvider.
    when('/', {
      redirectTo: '/home'
    }).
    when('/home', {
      controller: 'HomeCtrl',
      templateUrl: '/views/home.html'
    }).
    otherwise({
      redirectTo: '/404'
    })
  })

  app.controller('AppCtrl', function($scope, $mdMedia, $location, $mdSidenav, $http) {
    $scope.http = $http
    
    $scope.setPath = function (path) {
      $location.path(path)
    }

    $scope.toggleSideNav = function (menuId) {
      $mdSidenav(menuId).toggle()
    }

    $scope.menu = [{
      title: 'Home',
      icon: 'home',
      path: '/home',
    }, {
      title: 'Torrents',
      icon: 'file_download',
      path: '/home',
    }, {
      title: 'Feeds',
      icon: 'rss_feed',
      path: '/home',
    }, {
      title: 'Subscriptions',
      icon: 'star_rate',
      path: '/home',
    }, {
      title: 'Users',
      icon: 'person',
      path: '/home',
    }]

    $scope.title = 'Mr. Seedbox'
  })

  app.controller('HomeCtrl', function($scope, $mdMedia) {

  })

})()