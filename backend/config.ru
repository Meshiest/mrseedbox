#\ -p 443 -o 0.0.0.0
require 'rubygems'

$stdout.sync = true
 
require File.expand_path(File.dirname(__FILE__) + '/app')
 
run Sinatra::Application