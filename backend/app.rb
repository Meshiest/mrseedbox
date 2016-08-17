require 'rubygems'

require 'trans-api'
require 'oauth2'
require 'mysql2'
require 'open-uri'
require 'rss'
require 'json'
require 'sinatra/base'
require 'webrick'
require 'webrick/https'
require 'openssl'
require 'base64'


def envRequire name
  unless ENV[name]
    raise "You must specify the #{name} env variable"
  end
  ENV[name]
end

OWNER_LEVEL = 3
EDITOR_LEVEL = 2
MEMBER_LEVEL = 1
VISITOR_LEVEL = 0
PERMISSIONS = {
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

# transmission client

TRANSMISSION_CONFIG = {
  host: 'transmission',
  path: '/transmission/rpc',
  port: 9091,
  user: envRequire('TRANSMISSION_USER'),
  pass: envRequire('TRANSMISSION_PASS'),
}

puts "Setting up Transmission"
Trans::Api::Client.config = TRANSMISSION_CONFIG
Trans::Api::Torrent.default_fields = [ :id, :status, :name ]

# oauth2 client w/ google

G_API_CLIENT = envRequire('G_API_CLIENT')
G_API_SECRET = envRequire('G_API_SECRET')

puts "Setting up OAuth2 Client"
$oauth2Client = OAuth2::Client.new(G_API_CLIENT, G_API_SECRET, {
  :site          => 'https://accounts.google.com',
  :authorize_url => '/o/oauth2/auth',
  :token_url     => '/o/oauth2/token',
})

G_API_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

# mysql client

puts "Setting up Mysql"
until $mysql
  begin
    $mysql = Mysql2::Client.new({
      :host     => 'mysql',
      :port     => 3306,
      :username => envRequire('MYSQL_USER'),
      :password => envRequire('MYSQL_PASSWORD'),
      :database => envRequire('MYSQL_DATABASE'),
    })
  rescue
    puts "Couldn't Connect, waiting 5 seconds..."
    sleep 5
  end
end

puts "Creating Tables"
$mysql.query("""
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(64) UNIQUE,
  name VARCHAR(48),
  level INT NOT NULL DEFAULT 0,
  last_online BIGINT,
  create_time BIGINT
);""")
$mysql.query("""
CREATE TABLE IF NOT EXISTS feeds (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  creator_id INT,
  uri VARCHAR(256),
  name VARCHAR(48),
  update_duration INT,
  last_update BIGINT
);""")
$mysql.query("""
CREATE TABLE IF NOT EXISTS listeners (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  feed_id INT NOT NULL,
  name VARCHAR(256),
  pattern VARCHAR(48) DEFAULT '.',
  last_update BIGINT
);""")
$mysql.query("""
CREATE TABLE IF NOT EXISTS user_listeners (
  user_id INT NOT NULL,
  listener_id INT NOT NULL,
  last_seen BIGINT
);""")

$firstUser = $mysql.query("SELECT COUNT(*) FROM users").first["COUNT(*)"] == 0
if $firstUser
  puts "First user to sign in will be made the owner."
end

# feed loop
Thread.start {
  loop {
    begin
      feeds = $mysql.query("SELECT * FROM feeds;")
      to_add = []
      now = Time.now.to_i
      feeds.each do |feed|
        shouldUpdateFeed = false
        if feed['update_duration'] * 60 + (feed['last_update'] || 0) < now
          begin
            feedData = RSS::Parser.parse(feed['uri'])
            $mysql.query("SELECT * FROM listeners WHERE feed_id=#{feed['id']};").each do |listener|
              pattern = /#{listener['pattern']}/i
              shouldUpdate = false
              feedData.items.each do |item|
                updateTime = item.pubDate.to_i
                if pattern.match(item.title) && updateTime >= (listener['last_update'] || 0)
                  shouldUpdate = true
                  shouldUpdateFeed = true
                  to_add << item.link
                end
              end
              $mysql.query("UPDATE listeners SET last_update=#{now} WHERE id=#{listener['id']};") if shouldUpdate
            end
            $mysql.query("UPDATE feeds SET last_update=#{now} WHERE id=#{feed['id']};") if shouldUpdateFeed
          rescue
            puts "Error in feed #{feed['id']}", $!.backtrace
          end
        end
      end
      to_add.uniq!
      to_add.each do |link|
        begin
          puts "Adding #{link}"
          data = open(link, {ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE}).read
          data = Base64.encode64(data)
          Trans::Api::Torrent.add_metainfo data, 'rss torrent', {paused: false}
        rescue
        end
      end
    rescue
    end
    sleep 60
  }
}

def addUserToDb email, name, level
  begin
    puts "Adding #{email} to database with level #{level}"
    $mysql.query("INSERT INTO users (email, name, level, create_time) VALUES ('#{email}', '#{name}', #{level}, #{Time.now.to_i});")
    return $mysql.query("SELECT * FROM users WHERE email='#{email}';").first
  rescue
  end
end

def updateUserStatus user_id
  begin
    $mysql.query("UPDATE users SET last_online=#{Time.now.to_i} WHERE id=#{user_id};")
  rescue
  end
end

def hasPerm user_id, permission
  user = $mysql.query("SELECT * FROM users WHERE id='#{user_id}';").first
  return false unless user
  return PERMISSIONS[permission] <= user['level']
end

# sinatra

puts "Setting up Sinatra"

def redirect_uri
  uri = URI.parse(request.url)
  uri.path = '/oauth2callback'
  uri.query = nil
  uri.to_s
end

# ssl & config
unless File.exists?("cert.crt") && File.exists?("key.pem")
  raise "Please run ./setup to generate a SSL Cert"
end

certificate_content = File.open("cert.crt").read
key_content = File.open("key.pem").read 

server_options = {
  :Host => "0.0.0.0",
  :Port => "443",
  :SSLEnable => true,
  :SSLCertificate => OpenSSL::X509::Certificate.new(certificate_content),
  :SSLPrivateKey => OpenSSL::PKey::RSA.new(key_content)
}

$connections = []
class Server < Sinatra::Base

  set :json_content_type, :json
  set :sessions, true

  get '/' do
    if session[:user_id]
      @user = $mysql.query("SELECT * FROM users WHERE id=#{session[:user_id]};").first
      if !@user
        session.delete(:user_id)
        erb :login
      else
        erb :index
      end
    else
      erb :login
    end
  end

  get '/401' do
    if session[:user_id]
      redirect to('/')
    else
      erb :unauth
    end
  end

  error Sinatra::NotFound do
    status 404
    erb :oops
  end

  # Api Routes

  # files api

  get '/api/files' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_TORRENT
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else 
      status 200
      Dir["/transmission/downloads/*"].map{|i|i[('/transmission/downloads/'.length)..-1]}.to_json
    end
  end

  get '/api/dl' do
    user_id = session[:user_id]
    if !hasPerm user_id, :READ_TORRENT
      status 401
      content_type :json
      return {
        status: 401,
        message: "Not Authorized"
      }.to_json
    end
    file = URI.decode(params[:file])
    files = Dir["/transmission/downloads/*"].map{|i|i[('/transmission/downloads/'.length)..-1]}
    if files.include?(file)
      send_file '/transmission/downloads/'+file, {:filename => "#{file}", :stream => true}
    else
      status 404
      content_type :json
      return {
        status: 404,
        message: "Not Found"
      }.to_json
    end
  end

  # torrents api

  get '/api/torrents' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_TORRENT
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else
      status 200
      updateUserStatus user_id
      now = Time.now.to_i
      if !@lastTorrentTime || @lastTorrentTime && @lastTorrentTime + 1.5 < now
        torrents = []
        @lastTorrentTime = now
        Trans::Api::Torrent.all.each do |torrent|
          torrents << {
            id: torrent.id,
            name: torrent.name,
            state: torrent.status,
            status: torrent.status_name,
            files: torrent.files_objects.map{|f|{
                name: f.name,
                downloaded: f.bytes_completed,
                total: f.bytes_total,
              }
            },
          }
        end
        @lastTorrent = torrents
        return torrents.to_json
      else 
        return @lastTorrent.to_json
      end
    end
  end

  post '/api/torrents' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :EDIT_TORRENT
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      case params[:action]
      when "magnet"
        begin
          Trans::Api::Torrent.add_magnet URI.decode(params[:url]), {paused: false}
          status 200,
          {
            status: 200,
            message: "OK",
          }.to_json
        rescue
          status 500,
          {
            status: 500,
            message: "Error",
            backtrace: $!.backtrace
          }.to_json
        end
      when "url"
        begin
          data = open(URI.decode(params[:url]), {ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE}).read
          data = Base64.encode64(data)
          Trans::Api::Torrent.add_metainfo data, "api torrent by #{user_id}", {paused: false}
          status 200
          {
            status: 200,
            message: "OK",
          }.to_json
        rescue
          status 500
          {
            status: 500,
            message: "Error",
            backtrace: $!.backtrace
          }.to_json
        end
      else
        status 404
        {
          status: 404,
          message: "Operation '#{params[:action]}' Not Found",
        }.to_json
      end
    end
  end

  post '/api/torrents/:id/:action' do
    user_id = session[:user_id]
    id = params[:id]
    if id
      id = id.to_i rescue nil
    end
    torrent = nil
    begin
      torrent = Trans::Api::Torrent.find(id)
    rescue
    end
    content_type :json
    if !hasPerm user_id, :EDIT_TORRENT
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    elsif !torrent
      status 404
      {
        status: 404,
        message: "Torrent Not Found",
      }.to_json
    else
      updateUserStatus user_id
      case params[:action]
      when "start"
        begin
          torrent.start!
          status 200
          {
            status: 200,
            message: "OK",
          }.to_json
        rescue
          status 500
          {
            status: 500,
            message: "Error",
            backtrace: $!.backtrace
          }.to_json
        end
      when "stop"
        begin
          torrent.stop!
          status 200
          {
            status: 200,
            message: "OK",
          }.to_json
        rescue
          status 500
          {
            status: 500,
            message: "Error",
            backtrace: $!.backtrace
          }.to_json
        end
      when "delete"
        begin
          torrent.delete!({delete_local_data: true})
          status 200
          {
            status: 200,
            message: "OK",
          }.to_json
        rescue
          status 500
          {
            status: 500,
            message: "Error",
            backtrace: $!.backtrace
          }.to_json
        end
      else
        status 404
        {
          status: 404,
          message: "Operation '#{params[:action]}' Not Found",
        }.to_json
      end
    end
  end

  # user api

  get '/api/users' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_USER
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else
      status 200
      updateUserStatus user_id
      result = $mysql.query("SELECT * FROM users;")
      users = []
      result.each do |user|
        users << user
      end
      users.to_json
    end
  end

  post '/api/users' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :EDIT_USER
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      name = params[:name] || 'User'
      level = params[:level].to_i rescue nil
      level = level || 0
      validEmail = /^\A([\w+\-].?)+@[a-z\d\-]+(\.[a-z]+)*\.[a-z]+\z$/i.match(params[:email]) && params[:email].length > 0 && params[:email].length <= 64
      validUser = /^[a-z0-9_-]{0,48}$/i.match(name)
      validLevel = level >= 0 && level <= PERMISSIONS[:EDIT_USER]
      if validEmail
        emailIsUsed = $mysql.query("SELECT * FROM users WHERE email='#{params[:email]}';").size == 0
        validEmail = false unless emailIsUsed
      end
      unless validEmail && validUser && validLevel
        status 422
        {
          status: 422,
          message: "Invalid Parameters (Email:#{validEmail} Name:#{validUser} Level:#{validLevel})",
        }.to_json
      else
        addUserToDb params[:email], name, level
        status 200
        {
          status: 200,
          message: "OK",
        }.to_json
      end
    end
  end

  put '/api/users/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = params[:id].to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_USER) || user_id == target_id
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      user = $mysql.query("SELECT * FROM users WHERE id=#{target_id}").first
      unless user
          status 404
          return {
            status: 404,
            message: "User Not Found",
          }.to_json
      end
      if params[:name]
        unless /^[a-z0-9_-]{1,48}$/i.match(params[:name])
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        $mysql.query("UPDATE users SET name='#{params[:name]}' WHERE id=#{target_id};")
      end
      level = params[:level].to_i rescue nil
      if level && level != user['level']
        unless level >= 0 && level <= PERMISSIONS[:EDIT_USER]
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        unless hasPerm(user_id, :EDIT_USER)
          status 401
          return {
            status: 401,
            message: "Not Authorized",
          }.to_json
        end
        $mysql.query("UPDATE users SET level=#{level} WHERE id=#{target_id};")
      end

      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  delete '/api/users/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = target_id.to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_USER) || user_id == target_id
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      if !params[:id]
        status 422
        return {
          status: 422,
          message: "Invalid Parameters",
        }.to_json
      end
      target_user = $mysql.query("SELECT * FROM users WHERE id=#{target_id}").first
      if !target_user
        status 404
        return {
          status: 404,
          message: "User Not Found",
        }.to_json
      end
      $mysql.query("DELETE FROM users WHERE id=#{target_id};")
      if $mysql.query("SELECT COUNT(*) FROM users").first["COUNT(*)"] == 0
        $firstUser = true
      end
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  # listener api

  get '/api/listeners' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_LISTENER
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else
      status 200
      updateUserStatus user_id
      result = $mysql.query("SELECT * FROM listeners;")
      listeners = []
      result.each do |listener|
        listeners << listener
      end
      listeners.to_json
    end
  end

  post '/api/listeners' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :EDIT_LISTENER
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      feed_id = params[:feed_id]
      if feed_id
        feed_id = feed_id.to_i rescue nil
      end
      unless feed_id && $mysql.query("SELECT * FROM feeds WHERE id=#{feed_id};").first
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (Bad Feed_Id)",
        }.to_json
      end
      pattern = params[:pattern] || '.'
      name = params[:name] || "Listener for #{feed_id} #{pattern}"
      unless /^[a-z0-9_-]{1,48}$/i.match(name) && /^[a-z0-9().*+?|\[\]-]{1,48}$/i.match(pattern)
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (Bad name or pattern)",
        }.to_json
      end
      $mysql.query("INSERT INTO listeners (feed_id,name,pattern) VALUES (#{feed_id},'#{name}','#{pattern}')")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  put '/api/listeners/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = params[:id].to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_LISTENER)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      unless $mysql.query("SELECT * FROM listeners WHERE id=#{target_id}").first
        status 404
        return {
          status: 404,
          message: "Listener Not Found",
        }.to_json
      end
      if params[:name]
        unless /^[a-z0-9_-]{1,256}$/i.match(params[:name])
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        $mysql.query("UPDATE listeners SET name='#{params[:name]}' WHERE id=#{target_id};")
      end
      if params[:pattern]
        unless /^[a-z0-9().*+?|\[\]-]{1,48}$/i.match(params[:pattern])
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        $mysql.query("UPDATE listeners SET pattern='#{params[:pattern]}' WHERE id=#{target_id};")
      end

      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  delete '/api/listeners/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = target_id.to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_LISTENER)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      if !params[:id]
        status 422
        return {
          status: 422,
          message: "Invalid Parameters",
        }.to_json
      end
      unless $mysql.query("SELECT * FROM listeners WHERE id=#{target_id};").first
        status 404
        return {
          status: 404,
          message: "Listener Not Found",
        }.to_json
      end

      $mysql.query("DELETE FROM listeners WHERE id=#{target_id};")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  # feeds

  get '/api/feeds' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_FEED
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else
      status 200
      updateUserStatus user_id
      result = $mysql.query("SELECT * FROM feeds;")
      feeds = []
      result.each do |feed|
        feeds << feed
      end
      feeds.to_json
    end
  end

  post '/api/feeds' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :EDIT_FEED
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      uri = params[:url]
      name = params[:name]
      duration = params[:duration]
      if duration
        duration = duration.to_i rescue 15
      end
      unless name && uri && /^[a-z0-9_-]{1,48}$/i.match(name) && /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)$/i.match(uri) && name.length > 0 && name.length <= 48 && uri.length <= 256
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (Bad name(#{/^[a-z0-9_-]{1,48}$/i.match(name)}) or uri",
        }.to_json
      end
      begin 
        parsed = RSS::Parser.parse(uri)
      rescue
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (URL not RSS feed)",
        }.to_json
      end
      $mysql.query("INSERT INTO feeds (uri,name,update_duration,creator_id) VALUES ('#{uri}','#{name}',#{duration},#{user_id})")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  put '/api/feeds/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = params[:id].to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_FEED)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      unless $mysql.query("SELECT * FROM feeds WHERE id=#{target_id};").first
        status 404
        return {
          status: 404,
          message: "Feed Not Found",
        }.to_json
      end
      if params[:name]
        unless /^[a-z0-9_-]{1,256}$/i.match(params[:name])
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        $mysql.query("UPDATE feeds SET name='#{params[:name]}' WHERE id=#{target_id};")
      end
      duration = params[:duration].to_i rescue nil
      if params[:duration]
        unless duration && duration >= 15
          status 422
          return {
            status: 422,
            message: "Invalid Parameters",
          }.to_json
        end
        $mysql.query("UPDATE feeds SET update_duration=#{duration} WHERE id=#{target_id};")
      end

      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  delete '/api/feeds/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = target_id.to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_FEED)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      if !params[:id]
        status 422
        return {
          status: 422,
          message: "Invalid Parameters",
        }.to_json
      end
      unless $mysql.query("SELECT * FROM feeds WHERE id=#{target_id}").first
        status 404
        return {
          status: 404,
          message: "Feed Not Found",
        }.to_json
      end
      
      $mysql.query("DELETE FROM feeds WHERE id=#{target_id};")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  # users/listeners api

  get '/api/user/listeners' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :READ_SUBSCRIPTION
      status 401
      {
        status: 401,
        message: "Not Authorized"
      }.to_json
    else
      status 200
      updateUserStatus user_id
      result = $mysql.query("SELECT * FROM user_listeners WHERE user_id=#{user_id};")
      listeners = []
      result.each do |listener|
        listeners << listener
      end
      listeners.to_json
    end
  end

  post '/api/user/listeners' do
    user_id = session[:user_id]
    content_type :json
    if !hasPerm user_id, :EDIT_SUBSCRIPTION
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      listener_id = params[:listener_id]
      if listener_id
        listener_id = listener_id.to_i rescue nil
      end
      unless listener_id && $mysql.query("SELECT * FROM listeners WHERE id=#{listener_id};").first
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (Bad Listener_Id)",
        }.to_json
      end
      if $mysql.query("SELECT * FROM user_listeners WHERE user_id=#{user_id} AND listener_id=#{listener_id};").first
        status 422
        return {
          status: 422,
          message: "Invalid Parameters (Listener already exists)",
        }.to_json
      end


      $mysql.query("INSERT INTO user_listeners (user_id,listener_id) VALUES (#{user_id}, #{listener_id});")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  put '/api/user/listeners/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = params[:id].to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_SUBSCRIPTION)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      unless $mysql.query("SELECT * FROM user_listeners WHERE user_id=#{user_id} AND listener_id=#{target_id};").first
        status 404
        return {
          status: 404,
          message: "Listener Not Found",
        }.to_json
      end
      time = (!params[:time] || params[:time].length == 0) && Time.now.to_i || params[:time].to_i rescue Time.now.to_i
      $mysql.query("UPDATE user_listeners SET last_seen=#{time} WHERE user_id=#{user_id} AND listener_id=#{target_id};")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  delete '/api/user/listeners/:id' do
    user_id = session[:user_id]
    content_type :json
    target_id = params[:id]
    if target_id
      target_id = target_id.to_i rescue nil
    end
    unless hasPerm(user_id, :EDIT_SUBSCRIPTION)
      status 401
      {
        status: 401,
        message: "Not Authorized",
      }.to_json
    else
      updateUserStatus user_id
      if !params[:id]
        status 422
        return {
          status: 422,
          message: "Invalid Parameters",
        }.to_json
      end
      unless $mysql.query("SELECT * FROM user_listeners WHERE user_id=#{user_id} AND listener_id=#{target_id};").first
        status 404
        return {
          status: 404,
          message: "Feed Not Found",
        }.to_json
      end
      
      $mysql.query("DELETE FROM user_listeners WHERE user_id=#{user_id} AND listener_id=#{target_id};")
      status 200
      {
        status: 200,
        message: "OK",
      }.to_json
    end
  end

  # Auth Routes

  get "/logout" do
    if session[:user_id]
      updateUserStatus session[:user_id]
      session.delete(:user_id)
    end
    redirect to('/')
  end

  get "/auth" do
    if session[:user_id]
      redirect to('/')
    else
      redirect $oauth2Client.auth_code.authorize_url(
        :redirect_uri => redirect_uri,
        :scope => G_API_SCOPES,
        :access_type => "offline",
      )
    end
  end

  get '/oauth2callback' do
    if session[:user_id]
      redirect to('/')
    end
    begin
      access_token = $oauth2Client.auth_code.get_token(params[:code], :redirect_uri => redirect_uri)
      data = access_token.get('https://www.googleapis.com/userinfo/email?alt=json').parsed
      isVerified = data['data']['isVerified']
      email = data['data']['email']

      if $firstUser
        user = addUserToDb(email, "Admin", OWNER_LEVEL)
        $firstUser = false
      end
      
      user = $mysql.query("SELECT * FROM users WHERE email='#{email}';").first 
      if user
        session[:user_id] = user['id']
        updateUserStatus user['id']
        redirect to('/')
      else
        redirect to('/401')
      end
    rescue 
      puts $!.backtrace
      redirect to('/')
    end
  end

end

Rack::Handler::WEBrick.run Server, server_options