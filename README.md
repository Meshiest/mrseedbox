## Mr Seedbox

This is a readme I made in a rush, I will be adding more things in right now.

![](http://i.imgur.com/tMiGwxQ.png)
![](http://i.imgur.com/jmW8KzM.png)
![](http://i.imgur.com/uWYCPAm.png)
![](http://i.imgur.com/relNlJz.png)

##Install process (Still wip, sorry!):

1. Be running Linux
* Install Git
* Install docker
* Install docker-compose
* Create a Google API Project
* Add the Google+ API library
* Generate some Credentials for Oauth2
* `git clone https://github.com/Meshiest/mrseedbox.git`
* `cd mrseedbox`
* `cp common.env.default common.env`
* `cp docker-compose.yml.default docker-compose.yml`
* Edit your docker-compose.yml and common.env files (put google api client and secret in)
* Generate and SSL Cert: `./setup`

###Commands:

* `./start` - should start and build containers
* `docker-compose up -d` - same as above
* `./stop` - should stop containers
* `docker-compose kill ; docker-compose rm -f` - same as above
* `./db` - should open db container for debugging
* `./server` - should restart sinatra server container (by force >:) )
* `docker-compose restart mrseedbox_backend_1` - should be a nicer way of doing above
* `docker logs -f mrseedbox_backend_1` - read logs from sinatra server
* `docker ps` - list containers
* `docker exec -it mrseedbox_backend_1 bash` - get a shell in the backend container
