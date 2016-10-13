FROM ruby:2.2.3

ADD . /app
WORKDIR /app
RUN apt-get update
RUN apt-get install libmysqlclient-dev -y
RUN gem install bundler
RUN bundle install