(function(){
  
  var app = angular.module('SeedboxApp', ['ngMaterial','ngRoute','ngMessages'])

  app.config(function ($routeProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('teal', {
        default: '500',
        "hue-1": '50'
      })
      .accentPalette('red')


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
    when('/subscriptions', {
      controller: 'SubscriptionCtrl',
      templateUrl: '/views/subscriptions.html'
    }).
    when('/users', {
      controller: 'UserCtrl',
      templateUrl: '/views/users.html'
    }).
    when('/feeds', {
      controller: 'FeedCtrl',
      templateUrl: '/views/feeds.html'
    }).
    when('/404', {
      controller: 'HomeCtrl',
      templateUrl: '/views/notfound.html'
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

    var PERMISSIONS = $scope.PERMISSIONS = {
      EDIT_USER:         3,
      READ_USER:         1,
      EDIT_FEED:         2,
      READ_FEED:         0,
      EDIT_LISTENER:     1,
      READ_LISTENER:     0,
      EDIT_TORRENT:      1,
      READ_TORRENT:      0,
      EDIT_SUBSCRIPTION: 0,
      READ_SUBSCRIPTION: 0,
    }

    $scope.levels = {
      3: "Owner",
      2: "Editor",
      1: "Member",
      0: "Visitor",
    }

    $scope.menu = [{
      title: 'Chat',
      icon: 'chat',
      path: '/home',
      perm: 0,
    }, {
      title: 'Torrents',
      icon: 'file_download',
      path: '/torrents',
      perm: PERMISSIONS.READ_TORRENT,
    }, {
      title: 'Feeds',
      icon: 'rss_feed',
      path: '/feeds',
      perm: PERMISSIONS.READ_FEED,
    }, {
      title: 'Subscriptions',
      icon: 'star_rate',
      path: '/subscriptions',
      perm: PERMISSIONS.READ_SUBSCRIPTION,
    }, {
      title: 'Users',
      icon: 'person',
      path: '/users',
      perm: PERMISSIONS.READ_USER,
    }]

    $scope.title = 'Mr. Seedbox'

    $scope.level = window.user_level
    $scope.id = window.user_id

    $scope.messages = []
  })

  app.controller('HomeCtrl', function($scope, $timeout, $http) {
    $scope.messages = []
    $scope.lastUpdate = 0

    var updateInterval

    $scope.message = ''
    $scope.pending = false
    $scope.sendMessage = function() {
      if($scope.message.length < 1 || $scope.message.length > 256)
        return 
      $scope.pending = true
      $http({url:'/api/messages',method:'POST',params:{msg: $scope.message}}).
      success(function() {
        $scope.pending = false
        $scope.message = ''
        update()
      }).error(function(err) {
        $scope.pending = false

        $mdToast.show(
          $mdToast.simple()
            .textContent('Error Sending Message: ',err.message)
            .position('bottom left')
            .hideDelay(3000)
        )
      })
    }

    var update = function () {
      $timeout.cancel(updateInterval)

      $http.get('/api/messages').success(function(messages){
        for(i in messages) {
          var msg = messages[i]
          if(msg.time > $scope.lastUpdate) {
            $scope.lastUpdate = msg.time
            $scope.messages.push(msg)
          }
        }

        updateInterval = $timeout(update, 2000)
      }).error(function(err){
        if(err.status == 401)
          location.href='/logout'
        updateInterval = $timeout(update, 5000)
      })

    }

    update()

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel(updateInterval)
    })
  })

  app.controller('TorrentCtrl', function($scope, $http, $timeout, $mdDialog, $mdMedia, $mdToast) {

    $scope.torrents = []
    $scope.search = ''

    $scope.getOrder = function () {
      return $scope.search.length ? "name" : "id"
    }

    $scope.toggleTorrent = function(torrent) {
      torrent.toggle = !torrent.toggle
    }

    var updateInterval

    var update = function () {
      $timeout.cancel(updateInterval)

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
        for(var i = 0; i < $scope.torrents.length; i++) {
          var torrent = $scope.torrents[i]
          if(torrent.delete_flag) {
            $scope.torrents.splice(i--, 1)
          }
        }
        updateInterval = $timeout(update, 2000)
      }).error(function(err){
        if(err.status == 401)
          location.href='/logout'
        updateInterval = $timeout(update, 5000)
      })

    }

    update()

    $scope.handleTorrent = function(torrent) {
      if (torrent.status == "seeding" || torrent.status == "downloading" || torrent.status != "stopped") {
        $scope.stopTorrent(torrent)
      } else {
        $scope.startTorrent(torrent)
      }
    }

    $scope.startTorrent = function(torrent) {
      $http({url: "/api/torrents/"+torrent.id+"/start", method: "POST"}).success(function(){
        $mdToast.show(
          $mdToast.simple()
            .textContent('Starting Torrent')
            .position('bottom left')
            .hideDelay(3000)
        )
        update()
      }).error(function(err) {
        if(err.status == 401)
          location.href='/logout'

        $mdToast.show(
          $mdToast.simple()
            .textContent('Error Starting Torrent: ',err.message)
            .position('bottom left')
            .hideDelay(3000)
        )
      })
    }
    
    $scope.stopTorrent = function(torrent) {
      $http({url: "/api/torrents/"+torrent.id+"/stop", method: "POST"}).success(function(){
        $mdToast.show(
          $mdToast.simple()
            .textContent('Stopping Torrent')
            .position('bottom left')
            .hideDelay(3000)
        )
        update()
      }).error(function(err) {
        if(err.status == 401)
          location.href='/logout'

        $mdToast.show(
          $mdToast.simple()
            .textContent('Error Stopping Torrent: ',err.message)
            .position('bottom left')
            .hideDelay(3000)
        )
      })
    }

    $scope.removeTorrent = function(ev, torrent) {

      var confirm = $mdDialog.confirm()
        .title('Confirm Removal')
        .textContent('Are you certain you want to remove this torrent?')
        .ariaLabel('Confirm')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No')
      $mdDialog.show(confirm).then(function() {
        $http({url: "/api/torrents/"+torrent.id+"/delete", method: "POST"}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Removing Torrent')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error Removing Torrent: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {
      })
    }

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
          if(err.status == 401)
            location.href='/logout'
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

  app.filter('ago', function($filter){
    return function(time) {
      var now = Date.now()/1000
      var delta = now-time
      if(!time)
        return 'Never'
      if(delta < 0)
        return 'In The Future'
      if(delta < 10)
        return 'Now'
      if(delta < 60)
        return 'Moments Ago'
      if(delta < 60 * 60)
        return Math.round(delta/60) + ' Minute' + (Math.round(delta/60)!=1?'s':'') + ' Ago'
      if(delta < 60 * 60 * 24)
        return Math.round(delta/60/60) + ' Hour' + (Math.round(delta/60/60)!=1?'s':'') + ' Ago'
      if(delta < 60 * 60 * 24 * 7)
        return Math.round(delta/60/60/24) + ' Day' + (Math.round(delta/60/60/24)!=1?'s':'') + ' Ago'
      if(delta < 60 * 60 * 24 * 30)
        return Math.round(delta/60/60/24/7) + ' Week' + (Math.round(delta/60/60/24/7)!=1?'s':'') + ' Ago'
      return $filter('date')(time * 1000, 'd MMMM yyyy')
    }
  })

  app.filter('byte', function($filter) {
    return function(bytes) {
      if(bytes < 1024) return bytes + " B"
      else if(bytes < 1048576) return ~~(bytes / 1024).toFixed(3) + " KB"
      else if(bytes < 1073741824) return ~~(bytes / 1048576).toFixed(3) + " MB"
      else return ~~(bytes / 1073741824).toFixed(3) + " GB"
    }
  })

  app.controller('UserCtrl', function($scope, $http, $timeout, $mdDialog, $mdMedia, $mdToast) {

    $scope.users = []

    var updateInterval

    var update = function () {
      $timeout.cancel(updateInterval)

      $http.get('/api/users').success(function(users){
        var map = {}
        for(var i in $scope.users) {
          var user = $scope.users[i]
          user.delete_flag = true
          map[user.id] = user
        }
        for(var i in users) {
          var user = users[i]
          var exist = map[user.id]
          if(exist) {
            exist.name = user.name
            exist.email = user.email
            exist.level = user.level
            exist.last_online = user.last_online
            exist.create_time = user.create_time
            delete exist.delete_flag
          } else {
            $scope.users.push(user)
          }
        }
        for(var i = 0; i < $scope.users.length; i++) {
          var user = $scope.users[i]
          if(user.delete_flag) {
            $scope.users.splice(i--, 1)
          }
        }
        updateInterval = $timeout(update, 20000)
      }).error(function(err){
        if(err.status == 401)
          location.href='/logout'
        updateInterval = $timeout(update, 5000)
      })

    }

    update()

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel(updateInterval)
    })

    $scope.showUserDialog = function(ev, user){
      var editing = !!user
      var id
      var payload = {
        name: 'User',
        email: '',
        level: 0,
      }
      if(editing) {
        id = user.id
        payload = {
          name: user.name,
          level: user.level,
        }
      }
      $mdDialog.show({
        controller: 'DialogCtrl',
        templateUrl: 'views/dialogs/add_user.html',
        parent: angular.element(document.body),
        locals: {
          level: $scope.level,
          PERMISSIONS: $scope.PERMISSIONS,
          editing: editing,
          payload: payload
        },
        targetEvent: ev,
        clickOutsideToClose: true
      }).then(function(success) {
        $http({url: "/api/users" + (editing ? "/"+id : ""), method: (editing ? "PUT" : "POST"), params: success}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent((editing?"Editing":"Adding")+' User')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error '+(editing?"Editing":"Adding")+' User: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {})
    }


    $scope.removeUser = function(ev, user) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Removal')
        .textContent('Are you certain you want to remove this user?')
        .ariaLabel('Confirm')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No')
      $mdDialog.show(confirm).then(function() {
        $http({url: "/api/users/"+user.id, method: "DELETE"}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Removing User')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error Removing User: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {
      })
    }

  })

  app.controller('SubscriptionCtrl', function($scope, $http, $timeout, $mdDialog, $mdMedia, $mdToast) {
    $scope.listeners = []
    $scope.user_listeners = []


    var updateInterval

    var update = function () {
      $timeout.cancel(updateInterval)

      $http.get('/api/listeners').success(function(listeners){
        var listenerMap = {}
        for(var i in $scope.listeners) {
          var listener = $scope.listeners[i]
          listener.delete_flag = true
          listenerMap[listener.id] = listener
        }
        for(var i in listeners) {
          var listener = listeners[i]
          var exist = listenerMap[listener.id]
          if(exist) {
            exist.name = listener.name
            exist.pattern = listener.pattern
            exist.feed_id = listener.feed_id
            delete exist.delete_flag
          } else {
            listenerMap[listener.id] = listener
            $scope.listeners.push(listener)
          }
        }
        for(var i = 0; i < $scope.listeners.length; i++) {
          var listener = $scope.listeners[i]
          if(listener.delete_flag) {
            $scope.listeners.splice(i--, 1)
          }
        }
      }).success(function() {
        $http.get('/api/user/listeners').success(function(user_listeners){
          $scope.user_listeners = user_listeners
          var sub_map = {}
          for(var i in user_listeners) {
            var sub = user_listeners[i]
            sub_map[sub.listener_id] = sub
          }
          for(var i in $scope.listeners) {
            var listener = $scope.listeners[i]
            listener.sub = sub_map[listener.id]
          }
          updateInterval = $timeout(update, 20000)
        }).error(function(err){
          if(err.status == 401)
            location.href='/logout'
          updateInterval = $timeout(update, 5000)
        })

      }).error(function(err){
        if(err.status == 401)
          location.href='/logout'
        updateInterval = $timeout(update, 5000)
      })

    }

    $scope.updateSub = function(listener) {
      var time = listener.last_update > listener.sub.last_seen ? Math.floor(Date.now()/1000) : listener.last_update - 5
      $http({url: "/api/user/listeners/" + listener.id, method: "PUT", params: {time: time}}).success(function(){
        $mdToast.show(
          $mdToast.simple()
            .textContent('Updated Subscription')
            .position('bottom left')
            .hideDelay(3000)
        )
        listener.sub.last_seen = time
      }).error(function(err) {
        if(err.status == 401)
          location.href='/logout'

        $mdToast.show(
          $mdToast.simple()
            .textContent('Error Updating Subscription: ',err.message)
            .position('bottom left')
            .hideDelay(3000)
        )
      })
    }

    update()

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel(updateInterval)
    })
  })

  app.controller('FeedCtrl', function($scope, $http, $timeout, $mdDialog, $mdMedia, $mdToast) {

    $scope.feeds = []
    $scope.listeners = []
    $scope.user_listeners = []

    var updateInterval

    var update = function () {
      $timeout.cancel(updateInterval)

      $http.get('/api/feeds').success(function(feeds){
        var map = {}
        for(var i in $scope.feeds) {
          var feed = $scope.feeds[i]
          feed.delete_flag = true
          map[feed.id] = feed
        }
        for(var i in feeds) {
          var feed = feeds[i]
          var exist = map[feed.id]
          if(exist) {
            exist.name = feed.name
            exist.uri = feed.uri
            exist.creator_id = feed.creator_id
            exist.last_update = feed.last_update
            exist.update_duration = feed.update_duration
            delete exist.delete_flag
          } else {
            $scope.feeds.push(feed)
          }
        }
        for(var i = 0; i < $scope.feeds.length; i++) {
          var feed = $scope.feeds[i]
          if(feed.delete_flag) {
            $scope.feeds.splice(i--, 1)
          }
        }
        var listenerMap = {}
        $http.get('/api/listeners').success(function(listeners){
          for(var i in $scope.listeners) {
            var listener = $scope.listeners[i]
            listener.delete_flag = true
            listenerMap[listener.id] = listener
          }
          for(var i in listeners) {
            var listener = listeners[i]
            var exist = listenerMap[listener.id]
            if(exist) {
              exist.name = listener.name
              exist.pattern = listener.pattern
              exist.feed_id = listener.feed_id
              delete exist.delete_flag
            } else {
              listenerMap[listener.id] = listener
              $scope.listeners.push(listener)
            }
          }
          for(var i = 0; i < $scope.listeners.length; i++) {
            var listener = $scope.listeners[i]
            if(listener.delete_flag) {
              $scope.listeners.splice(i--, 1)
            }
          }
        }).success(function() {
          $http.get('/api/user/listeners').success(function(user_listeners){
            $scope.user_listeners = user_listeners
            var sub_map = {}
            for(var i in user_listeners) {
              var sub = user_listeners[i]
              sub_map[sub.listener_id] = sub
            }
            for(var i in $scope.listeners) {
              var listener = $scope.listeners[i]
              listener.sub = sub_map[listener.id]
            }
            updateInterval = $timeout(update, 20000)
          }).error(function(err){
            if(err.status == 401)
              location.href='/logout'
            updateInterval = $timeout(update, 5000)
          })

        }).error(function(err){
          if(err.status == 401)
            location.href='/logout'
          updateInterval = $timeout(update, 5000)
        })
        
      }).error(function(err){
        if(err.status == 401)
          location.href='/logout'
        updateInterval = $timeout(update, 5000)
      })


    }


    update()

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel(updateInterval)
    })

    $scope.toggleListener = function(listener) {
      $http({url: "/api/user/listeners"+(listener.sub ? "/" + listener.id : ""), method: (listener.sub ? "DELETE" : "POST"), params: {listener_id: listener.id}}).success(function(){
        $mdToast.show(
          $mdToast.simple()
            .textContent((listener.sub?"Removing":"Adding")+' Subscription')
            .position('bottom left')
            .hideDelay(3000)
        )
        listener.sub = !listener.sub
      }).error(function(err) {
        if(err.status == 401)
          location.href='/logout'

        $mdToast.show(
          $mdToast.simple()
            .textContent('Error '+(listener.sub?"Removing":"Adding")+' Subscription: ',err.message)
            .position('bottom left')
            .hideDelay(3000)
        )
      })
    }

    $scope.showFeedDialog = function(ev, feed){
      var editing = !!feed
      var id
      var payload = {
        url: '',
        name: 'Feed',
        duration: 15
      }
      if(editing) {
        id = feed.id
        payload = {
          url: feed.uri,
          name: feed.name,
          duration: feed.update_duration
        }
      }
      $mdDialog.show({
        controller: 'DialogCtrl',
        templateUrl: 'views/dialogs/add_feed.html',
        parent: angular.element(document.body),
        locals: {
          editing: editing,
          payload: payload
        },
        targetEvent: ev,
        clickOutsideToClose: true
      }).then(function(success) {
        $http({url: "/api/feeds" + (editing ? "/"+id : ""), method: (editing ? "PUT" : "POST"), params: success}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent((editing?"Editing":"Adding")+' Feed')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error '+(editing?"Editing":"Adding")+' Feed: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {})
    }


    $scope.removeFeed = function(ev, feed) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Removal')
        .textContent('Are you certain you want to remove this feed?')
        .ariaLabel('Confirm')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No')
      $mdDialog.show(confirm).then(function() {
        $http({url: "/api/feeds/"+feed.id, method: "DELETE"}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Removing Feed')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error Removing Feed: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {
      })
    }

    $scope.showListenerDialog = function(ev, feed, listener){
      var editing = !!listener
      var id
      var payload = {
        feed_id: feed.id,
        name: 'Listener',
        pattern: '.'
      }
      if(editing) {
        id = listener.id
        payload = {
          name: listener.name,
          pattern: listener.pattern
        }
      }
      $mdDialog.show({
        controller: 'DialogCtrl',
        templateUrl: 'views/dialogs/add_listener.html',
        parent: angular.element(document.body),
        locals: {
          editing: editing,
          payload: payload
        },
        targetEvent: ev,
        clickOutsideToClose: true
      }).then(function(success) {
        $http({url: "/api/listeners" + (editing ? "/"+id : ""), method: (editing ? "PUT" : "POST"), params: success}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent((editing?"Editing":"Adding")+' Listener')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error '+(editing?"Editing":"Adding")+' Listener: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {})
    }


    $scope.removeListener = function(ev, listener) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Removal')
        .textContent('Are you certain you want to remove this listener?')
        .ariaLabel('Confirm')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No')
      $mdDialog.show(confirm).then(function() {
        $http({url: "/api/listeners/"+listener.id, method: "DELETE"}).success(function(){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Removing Listener')
              .position('bottom left')
              .hideDelay(3000)
          )
          update()
        }).error(function(err) {
          if(err.status == 401)
            location.href='/logout'

          $mdToast.show(
            $mdToast.simple()
              .textContent('Error Removing Listener: ',err.message)
              .position('bottom left')
              .hideDelay(3000)
          )
        })
      }, function() {
      })
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