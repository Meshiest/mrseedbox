## Mr Seedbox

I use this repo to test weird coding habits on a larger scale, don't expect the code to be pretty

### New Screenshots
<img src="https://i.imgur.com/rcrpdfS.png" width="512"/>
<img src="https://i.imgur.com/DVS0ivY.png" width="512"/>
<img src="https://i.imgur.com/yhPPTDj.png" width="512"/>
<img src="https://i.imgur.com/dHCrbq6.png" width="512"/>
<img src="https://i.imgur.com/Dg4yvZs.png" width="512"/>

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
* `cp docker-compose.yml.default docker-compose.yml` OR `cp letsencrypt-docker-compose.yml docker-compose.yml` for letsencrypt
* Edit your docker-compose.yml and common.env files (put google api client and secret in)
  * Make sure you change EXAMPLE.COM if you're using the letsencrypt dockerfile
* Generate a SSL Cert: `./setup`
  * If you are using LetsEncrypt, you can use `certbot certonly --standalone`
  * If you are using LetsEncrypt, make sure you generate a dhparam:
    * `sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048`
* The **first person to connect and auth will be the "owner"**
* You will have to go through the initial emby setup at `localhost:8096`!
* If you are migrating from the old versions, you may have to `docker build backend` before starting the containers. If that doesn't work, you should remove all containers and images associated with this app and `./start` it again
* **Don't forget to add this to your MyAnimeList Custom CSS for the best experience**: `@import url(https://gist.githubusercontent.com/Meshiest/cf3a3a4e16f5669ce7540445bf5b4cbf/raw/style.css)`

If you do use the above LetsEncrypt instructions, you should get some nice A+ SSL like this:

![](https://i.imgur.com/ZVDQet3.png)

### Commands (from shell):

* `./start` - start, build, and update containers. If you need to update emby, you can run this
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
* NPM/node

### Updating the Backend (`./backend`)
1. Make your changes
2. `docker build .` 
3. `./start` from the parent directory and `docker logs -f mrseedbox_backend_1` and check if there were any problems starting the container

### Updating the frontend (`./backend/public/js`)
1. Change app.jsx
2. `npm install --only=dev` in backend/public/js
3. `npm test`
