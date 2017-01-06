FROM ruby:2.4

ADD . /app
WORKDIR /app
RUN apt-get update && apt-get install libmysqlclient-dev -y
RUN gem install rack -v 1.6.4 --no-ri --no-rdoc
RUN gem install redis-store oauth2 open_uri_redirections sinatra httparty retort nokogiri mysql2 --no-ri --no-rdoc

# Bundler ruins everything -_-
# After 7 hours of troubleshooting some bullshit bug that effected 90% of my gems
# I removed it and stopped having problems! :)

# Ideally our next version of mrseedbox will be in go!