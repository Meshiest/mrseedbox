FROM ruby:2.4

ADD . /app
WORKDIR /app
RUN apt-get update && apt-get install libmysqlclient-dev -y
RUN gem install rack -v 1.6.4
RUN gem install mysql2 oauth2 open_uri_redirections sinatra httparty nokogiri retort --no-ri --no-rdoc

# Bundler ruins everything -_-

#RUN gem install bundler
#RUN rm Gemfile.lock
#RUN bundle install