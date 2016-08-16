(function(){
  
  var app = angular.module('SeedboxApp', ['ngMaterial','ngRoute','ngMessages'])

  app.config(function ($routeProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('orange', {
        default: '800',
        "hue-1": '50'
      })
      .accentPalette('blue')

    $mdThemingProvider.theme('input', 'default')
      .primaryPalette('grey')

    $mdThemingProvider.alwaysWatchTheme(true)

    $mdThemingProvider.theme('status_').
    primaryPalette('red', {
      'default': '500'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_stopped').
    primaryPalette('grey', {
      'default': '600'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_checkQueue').
    primaryPalette('purple', {
      'default': '500'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_checkFiles').
    primaryPalette('yellow', {
      'default': '500'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_downloadQueue').
    primaryPalette('blue', {
      'default': '500'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_downloading').
    primaryPalette('blue', {
      'default': '900'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_seedQueue').
    primaryPalette('green', {
      'default': '600'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_seeding').
    primaryPalette('green', {
      'default': '900'
    }).accentPalette('grey', { 'default': '900' })

    $mdThemingProvider.theme('status_islated').
    primaryPalette('red', {
      'default': '500'
    }).accentPalette('grey', { 'default': '900' })



    $routeProvider.
    when('/', {
      redirectTo: '/home'
    }).
    when('/home', {
      controller: 'HomeCtrl',
      templateUrl: '/views/home.html'
    }).
    when('/torrents', {
      controller: 'TorrentCtrl',
      templateUrl: '/views/torrents.html'
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
      path: '/torrents',
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

  app.controller('HomeCtrl', function($scope) {

  })

  app.controller('TorrentCtrl', function($scope, $http, $timeout, $mdDialog, $mdMedia, $mdToast) {

    $scope.torrents = []

    var updateInterval

    var update = function () {

      $http.get('/api/torrents').success(function(torrents){
        var map = {}
        for(var i in $scope.torrents) {
          var torrent = $scope.torrents[i]
          torrent.delete_flag = true
          map[torrent.id] = torrent
        }
        for(var i in torrents) {
          var torrent = torrents[i]
          var exist = map[torrent.id]
          if(exist) {
            exist.name = torrent.name
            exist.state = torrent.state
            exist.status = torrent.status
            exist.files = torrent.files
            delete exist.delete_flag
          } else {
            $scope.torrents.push(torrent)
          }
        }
        updateInterval = $timeout(update, 2000)
      }).error(function(err){
        updateInterval = $timeout(update, 5000)
      })

      for(var i = 0; i < $scope.torrents.length; i++) {
        var torrent = $scope.torrents[i]
        if(torrent.delete_flag) {
          $scope.torrents.splice(i--, 1)
        }
      }
    }

    update()

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel(updateInterval)
    })


    $scope.getProgress = function(torrent) {
      var total = 0
      var progress = 0
      for(var i in torrent.files) {
        total += torrent.files[i].total
        progress += torrent.files[i].downloaded
      }
      return progress / total * 100
    }

    $scope.showLinkDialog = function(ev, type){
      $mdDialog.show({
        controller: 'DialogCtrl',
        templateUrl: 'views/dialogs/add_torrent_link.html',
        parent: angular.element(document.body),
        locals: {
          payload: {
            action: type,
            url: ''
          }
        },
        targetEvent: ev,
        clickOutsideToClose: true
      }).then(function(success) {
        $http({url: "/api/torrents", method: "POST", params: success}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Adding Torrent')
              .position('bottom left')
              .hideDelay(3000)
          )
        }).error(function(err) {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Error Adding Torrent: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {})
    }

    

  })
  app.controller('DialogCtrl', function($scope, $http, locals, $mdDialog) {
    $scope.locals = locals

    $scope.hide = function() {
      $mdDialog.hide()
    }

    $scope.cancel = function() {
      $mdDialog.cancel()
    }

    $scope.answer = function (answer) {
      $mdDialog.hide(answer)
    }
  })



})()