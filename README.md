## Mr Seedbox

### Screenshots

![](http://i.imgur.com/WDeD1Is.png)
![](http://i.imgur.com/tMiGwxQ.png)
![](http://i.imgur.com/jmW8KzM.png)
![](http://i.imgur.com/uWYCPAm.png)
![](http://i.imgur.com/relNlJz.png)
![](http://i.imgur.com/s9AOqUZ.png)
![](http://i.imgur.com/bbXlsPd.png)

## Install process (Still wip, sorry!):

1. Be running Linux
* Install Git
* Install docker
* Install docker-compose
* Create a Google API Project
* Add the Google+ API library
* Generate some Credentials for Oauth2
  * Application Type:
    * Web Application
  * Authorized origins:
    * `https://localhost` or `https://yourdomain.com`
  * Authorized redirect URIs:
    * `https://localhost/oauth2callback` or `https://yourdomain.com/oauth2callback`
* `git clone https://github.com/Meshiest/mrseedbox.git`
* `cd mrseedbox`
* `cp common.env.default common.env`
* `cp docker-compose.yml.default docker-compose.yml`
* Edit your docker-compose.yml and common.env files (put google api client and secret in)
* Generate a SSL Cert: `./setup`
* `cp settings.json transmission/config/settings.json` (and make neccessary dirs)
* The **first person to connect and auth will be the "owner"**
* You will have to go through the initial emby setup at `localhost:8096`!
* If you are migrating from the old versions, you may have to `docker build backend` before starting the containers

### Commands (from shell):

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
* You should know that creating a `debug` file in the backend folder will prevent authentication

## Contributing

### Things You Need
* You need docker

### Updating the Backend (this is all in the `backend` directory)
1. Make your changes
2. `docker build .`
3. `./start` from the parent directory and `docker logs -f mrseedbox_backend_1` and check if there were any problems starting the container