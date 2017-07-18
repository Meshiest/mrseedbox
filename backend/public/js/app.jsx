const { HashRouter, Route, Switch } = ReactRouterDOM;

const teal500 = '#00897B';
const blue100 = '#BBDEFB';
const green100 = '#C8E6C9';
const blue600 = '#039BE5';
const grey100 = '#F5F5F5';

const accentColor = blue600;
const primaryFgColor = '#ffffff';
const primaryBgColor = teal500;
const tintColor = grey100;
const cardBg = '#ffffff';
const bgColor = '#eeeeee';
const subheaderColor = '#555555';

// Permission levels
const OWNER_LEVEL   = 3;
const EDITOR_LEVEL  = 2;
const MEMBER_LEVEL  = 1;
const VISITOR_LEVEL = 0;
const UI_LEVELS = {
  3: "Owner",
  2: "Editor",
  1: "Member",
  0: "Visitor",
};
const PERMISSIONS   = {
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
  OWNER_LEVEL:       3,
  EDITOR_LEVEL:      2,
  MEMBER_LEVEL:      1,
  VISITOR_LEVEL:     0,
};

/*
  Boolean - Returns true if the object, `props` has the
    key, `key`
*/
function $hasProp(props, key) {
  return Object.keys(props).includes(key);
}

/*
  Function - Returns a function that redirects to the
    provided `path`
*/
function $to(path) {
  return () => location.hash = '#/' + path;
}

/*
  [onTrue] - Returns `onTrue` if the `condition` is true,
    otherwise returns null
*/
function $if(condition, onTrue) {
  return condition ? onTrue : null;
}

/*
  Component - Returns `elem` if the current user is above
    or equal to `level` in permissions, also see `PERMISSIONS`
*/
function $level(level, elem) {
  return $if(user_level >= level, elem);
}

/*
  String - Takes a byte input and converts to a reasonable metric
  1024 B = 1 KB
*/
function $bytes(bytes) {
  bytes = ~~bytes;
  if(bytes < 1024) return bytes + ' B';
  else if(bytes < 1048576) return ~~(bytes / 1024).toFixed(3) + ' KB';
  else if(bytes < 1073741824) return ~~(bytes / 1048576).toFixed(3) + ' MB';
  else return ~~(bytes / 1073741824).toFixed(3) + ' GB';
}

/*
  Refreshes the page when a user has invalid authorization
*/
function $handleError(err) {
  if(err && err.status === 401)
    location.reload();
  console.warn(err);
}

/*
  Closes the opened modal
*/
function $closeModal(e) {
  $('#modal').html('').css('display', 'none');
}

/*
  Opens a given component as a modal
*/
function $openModal(component) {
  $('#modal').css('display', 'block');
  ReactDOM.render(component, $('#modal')[0]);
}

/*
  Promise - Opens a modal with given title and text with "yes" and "no" buttons
*/
function $confirmModal(title, text) {
  return new Promise((resolve, reject) => {  
    $openModal(
    <Modal title={title} onClose={e => {
      $closeModal();
      reject();
    }}>
      <Padding style={{display: 'flex', flexDirection: 'column'}}>
        <Padding>
          {text}
        </Padding>
        <div style={{display: 'flex', justifyContent: 'flex-end', padding: '16px'}}>
          <button type="submit"
            style={{fontSize: '16px', padding: '8px'}}
            onClick={e => {
              $closeModal();
              reject();
            }}>
            No
          </button>
          <button type="submit"
            className="primary"
            style={{fontSize: '16px', padding: '8px'}}
            onClick={e => {
              $closeModal();
              resolve();
            }}>
            Yes
          </button>
        </div>
      </Padding>
    </Modal>);
  });
}

/*
  String - A smart timestamp function given a unix time in seconds
*/
function $ago(time) {
  var now = Date.now()/1000;
  var delta = now-time;
  if(!time)
    return 'Never';
  if(delta < 0)
    return 'In The Future';
  if(delta < 10)
    return 'Now';
  if(delta < 60)
    return 'Moments Ago';
  if(delta < 60 * 60)
    return Math.round(delta/60) + ' Minute' + (Math.round(delta/60)!=1?'s':'') + ' Ago';
  if(delta < 60 * 60 * 24)
    return Math.round(delta/60/60) + ' Hour' + (Math.round(delta/60/60)!=1?'s':'') + ' Ago';
  if(delta < 60 * 60 * 24 * 7)
    return Math.round(delta/60/60/24) + ' Day' + (Math.round(delta/60/60/24)!=1?'s':'') + ' Ago';
  if(delta < 60 * 60 * 24 * 30)
    return Math.round(delta/60/60/24/7) + ' Week' + (Math.round(delta/60/60/24/7)!=1?'s':'') + ' Ago';

  let date = new Date(time);
  let month = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September', 'October',
    'November', 'December'
  ];

  return `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()}`;
}

/*
  Array - Filters out the given array with the function `fn`
*/
function $filter(arr, fn) {
  let newArr = [];
  arr.forEach(a => {
    if(fn(a))
      newArr.push(a)
  });
  return newArr;
}

// Core app component
class Seedbox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='mrseedbox'
        style={{
          backgroundColor: bgColor,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Toolbar title="MrSeedbox">
          <HeaderRow flex>
            <IconButton primary
              icon="home"
              onClick={$to('')}/>
            {$level(PERMISSIONS.READ_TORRENT,
              <IconButton primary
                icon="video_library"
                onClick={$to('emby')}/>
            )}
            {$level(EDITOR_LEVEL,
              <IconButton primary
                icon="file_download"
                onClick={$to('rutorrent')}/>
            )}
          </HeaderRow>
          <HeaderRow>
            <PopupButton title="Animelist"
              icon="list"
              id="popup-animelist">
              <Animelist/>
            </PopupButton>
            <PopupButton title="Chat"
              icon="chat"
              id="popup-chat">
              <Chat/>
            </PopupButton>
            <PopupButton title="Subscriptions"
              icon="stars"
              id="popup-subscriptions">
              <Subscriptions/>
            </PopupButton>
          </HeaderRow>
        </Toolbar>
        <HashRouter>
          <Switch>
            <Route exact path="/" component={Home}/>

            {$level(PERMISSIONS.READ_TORRENT,
              <Route exact path="/emby" component={Emby}/>
            )}

            {$level(EDITOR_LEVEL,
              <Route exact path="/rutorrent" component={RuTorrent}/>
            )}
          </Switch>
        </HashRouter>
      </div>
    );
  }
};

// Welcome and some subscriptions
class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Dashboard/>
        <Feeds/>
        {$level(PERMISSIONS.READ_USER, <Users/>)}
        <Torrents/>
      </div>
    );
  }
}

// Renders a welcome message for the user
class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    let user = {
      name: user_name,
      id: user_id,
      level: user_level,
      email: user_email,
    };
    
    let welcome = this.getWelcome();
    this.state = {
      user,
      welcome, 
      listeners: {},
      subscriptions: [],
    };

    this.updateListeners = this.updateListeners.bind(this);
    this.updateListeners();
    
    // get a new welcome every minute or so
    this.welcomeInterval = setInterval(() => {
      this.setState({welcome: this.getWelcome()});
      this.updateListeners();
    }, 15 * 60 * 1000);
  }

  updateListeners() {
    $.ajax({
      url: '/api/listeners'
    }).then(arr => {
      let listeners = {};
      arr.forEach(l => listeners[l.id] = l);
      $.ajax({
        url: '/api/user/listeners'
      }).then(subscriptions => {
        subscriptions = $filter(subscriptions, s =>
          typeof s.last_seen === 'undefined' || s.last_seen < listeners[s.listener_id].last_update);
        this.setState({ subscriptions, listeners });
      }, $handleError);
    }, $handleError);
  }

  componentWillUnmount() {
    clearInterval(this.welcomeInterval);
  }

  getWelcome() {
    let welcome = 'Welcome';
    let time = new Date();
    let hours = time.getHours(), mins = time.getMinutes();

    if(5 <= hours && hours <= 8)
      welcome = 'Good Morning';

    if(hours > 8 && hours < 12)
      welcome = 'Top of the Morning';

    if(hours === 12 && mins <= 5)
      welcome = 'It\'s High Noon';

    else if(hours >= 12 && hours <= 17)
      welcome = 'Good Afternoon';
      
    if(hours > 17 && hours <= 21)
      welcome = 'Good Evening';

    if(hours > 21 || hours < 5)
      welcome = 'Good Night';
    
    return welcome;
  }

  render() {
    let { user, welcome } = this.state;
    return (
      <div style={{
          alignItems: 'center',
          color: subheaderColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
        <h2 style={{
            marginTop: '16px',
          }}>
          {welcome}, {user.name}
        </h2>
        <subhead style={{
            fontSize: '12px',
          }}>
          {user.email} 
        </subhead>
        <sup style={{fontSize: '12px', marginBottom: '8px'}}>
          {UI_LEVELS[user_level]} #{user_id}
        </sup>
        {$if(this.state.subscriptions.length, 
          <div style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <h2 style={{
              marginBottom: '8px',
              marginTop: '16px',
            }}>
              You Have New Updates
            </h2>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                maxWidth: '300px',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {this.state.subscriptions.map(s => 
                <Chip primary={true} icon="visibility" key={s.listener_id} onClick={e => {
                    let time = Math.floor(Date.now()/1000);
                    $.ajax({
                      url: `/api/user/listeners/${s.listener_id}`,
                      method: 'PUT',
                      data: {time},
                    }).then(this.updateListeners, $handleError);
                  }}>
                  {this.state.listeners[s.listener_id].name}
                </Chip>
              )}
            </div>
          </div>
        )}
        <IconButton icon="exit_to_app" style={{
          position: 'absolute',
          right: '0',
          top: '48px',
        }} onClick={() => $.ajax('/logout').then(e=>location.reload(), e=>location.reload())}/>
      </div>
    );
  }
}

// List of chips for a popup
class Subscriptions extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      subscriptions: [],
      listeners: {},
    };

    this.updateListeners = this.updateListeners.bind(this);
    this.updateListeners();

    this.updateInterval = setInterval(() => {
      this.updateListeners();
    }, 5 * 60 * 1000);
  }

  updateListeners() {
    $.ajax({
      url: '/api/listeners'
    }).then(arr => {
      let listeners = {};
      arr.forEach(l => listeners[l.id] = l);
      $.ajax({
        url: '/api/user/listeners'
      }).then(subscriptions => {
        subscriptions.forEach(s => {
          s.unseen = typeof s.last_seen === 'undefined' || s.last_seen < listeners[s.listener_id].last_update;
        });
        this.setState({ subscriptions, listeners });
      }, $handleError);
    }, $handleError);
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
  }

  render() {
    return (
      <div style={{
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
        {$if(!this.state.subscriptions.length, (
          <h2 style={{
            alignItems: 'center',
            color: subheaderColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginTop: '20px',
          }}>
            <span>No Subscriptions</span>
            <Icon>mood_bad</Icon>
          </h2>
        ))}
        {this.state.subscriptions.sort((a,b)=>(b.unseen ? 1 : 0) - (a.unseen ? 1 : 0)).map(s => {
          return <Chip primary={s.unseen} icon={'visibility' + (s.unseen ? '' : '_off')} key={s.listener_id} onClick={e => {
              let time = s.unseen ? Math.floor(Date.now()/1000) : this.state.listeners[s.listener_id].last_update - 5;
              $.ajax({
                url: `/api/user/listeners/${s.listener_id}`,
                method: 'PUT',
                data: {time},
              }).then(this.updateListeners, $handleError);
            }}>
            {this.state.listeners[s.listener_id].name}
          </Chip>
        })}
      </div>
    );
  }
}

// Chat window for a popup
class Chat extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      messages: [],
    };

    this.updateMessages = this.updateMessages.bind(this);
    this.updateMessages();

    this.updateInterval = setInterval(() => {
      this.updateMessages();
    }, 1000);
  }

  updateMessages() {
    $.ajax({
      url: '/api/messages',
    }).then(messages => this.setState({messages}), $handleError);
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
  }

  render() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}>
        <form style={{
            display: 'flex',
            flexDirection: 'row',
          }} onSubmit={e => {
            e.preventDefault();
            $.ajax({
              url: '/api/messages',
              method: 'post',
              data: {
                msg: e.target.message.value
              }
            }).then(this.updateMessages, $handleError);
            e.target.message.value = '';
          }}>
          <Input name="message"
            autocomplete="off"
            style={{flex: '1'}}
            placeholder="Message"/>
        </form>
        <div style={{overflowY: 'auto', maxHeight: '200px', backgroundColor: bgColor}}>
          {this.state.messages.map(m => (
            m.user_id === user_id ? (
              <div style={{
                  borderRadius: '4px', 
                  backgroundColor: '#B2DFDB',
                  padding: '4px',
                  margin: '4px',
                  marginLeft: '16px',
                }}>
                <div>
                  {m.message}
                </div>
                <div style={{
                    color: subheaderColor,
                    fontSize: '10px',
                    textAlign: 'right',
                  }}>
                  {$ago(m.time)}
                </div>
              </div>
            ) : (
              <div style={{
                  borderRadius: '4px', 
                  backgroundColor: cardBg,
                  padding: '4px',
                  margin: '4px',
                  marginRight: '16px',
                }}>
                <div style={{
                    fontWeight: 'bold'
                  }}>
                  {m.name || `[deleted #${m.user_id}]`}
                </div>
                <div>
                  {m.message}
                </div>
                <div style={{
                    color: subheaderColor,
                    fontSize: '10px',
                    textAlign: 'right',
                  }}>
                  {$ago(m.time)}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }
}

// MyAnimeList popup content
class Animelist extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: localStorage.MALName || '',
      ready: false,
    };
  }

  render() {
    return this.state.ready ? (
      <iframe style={{
          border: 'none',
          height: '300px',
        }}
        src={'https://myanimelist.net/animelist/' + this.state.username}/>
    ) : (
      <div style={{
          alignItems: 'center',
          display: 'flex',
          padding: '16px',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
        <form onSubmit={e => {
            e.preventDefault();
            localStorage.MALName = e.target.username.value;
            this.setState({username: e.target.username.value, ready: true});
          }}>
          <Input name="username"
            placeholder="MAL Username"
            defaultValue={this.state.username}/>
        </form>
        <a style={{
            fontSize: '12px',
            fontStyle: 'italic',
            marginTop: '8px',
          }}
          target="_blank" 
          href="https://gist.github.com/Meshiest/cf3a3a4e16f5669ce7540445bf5b4cbf">
          It's recommended to use this style
        </a>
      </div>
    );
  }
}

// Renders all torrents in a table
class Torrents extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      torrents: [],
      order: 'progress',
      reverse: true,
    };

    this.getTorrents = this.getTorrents.bind(this);
    this.reorder = this.reorder.bind(this);
    this.order = this.order.bind(this);
  }

  componentDidMount() {
    this.getTorrents();
  }

  getProgress(torrent) {
    var total = 0;
    var progress = 0;
    for(var i in torrent.files) {
      var totalChunks = torrent.files[i].totalChunks;
      var completedChunks = torrent.files[i].completedChunks;
      total += totalChunks;
      progress += completedChunks;
      torrent.files[i].progress = completedChunks / totalChunks;

    }
    return progress / total * 100;
  }

  componentWillUnmount() {
    clearTimeout(this.updateTimeout);
  }

  getTorrents(again) {
    clearTimeout(this.updateTimeout);

    $.ajax({url: '/api/torrents'})
    .then(
      torrents => {
        torrents.forEach(t => {
          t.progress = t.ratio * 100;
          t.download = 0;
          t.total = 0;
          t.files.forEach(f => {
            let ratio = f.completedChunks / f.totalChunks;
            t.download += f.size;
            t.total += f.size / ratio;
          });
        });
        this.setState({torrents});
        this.updateTimeout = setTimeout(() => this.getTorrents(), Math.max(5000, Math.min(60000, torrents.length * 1000)));
      },
      error => {
        $handleError(error);
        this.updateTimeout = setTimeout(() => this.getTorrents(), 300000);
      }
    );
  }

  order() {
    let { order, reverse } = this.state;
    reverse = reverse ? -1 : 1;
    return (a, b) => (
        reverse * (typeof a[order] === 'string' ?
          a[order].localeCompare(b[order]) : a[order] - b[order]
      ));
  }

  reorder(order) {
    if(this.state.order === order)
      this.setState({reverse: !this.state.reverse});
    else
      this.setState({order, reverse: false})
  }

  render() {
    return (
      <Card>
        <CardHeader title="Torrents">
          {$level(PERMISSIONS.EDIT_TORRENT,
            <AddButton placeholder="Torrent or Magnet Link"
              onSubmit={result => {
                $.ajax({
                  method: 'post',
                  url: '/api/torrents',
                  data: {
                    url: result
                  }
                }).then(
                  resp => {
                    this.getTorrents();
                  },
                  $handleError
                )
              }}/>
          )}
          <IconButton icon="refresh" onClick={this.getTorrents}/>
        </CardHeader>
        {this.state.torrents.length ? <div style={{overflow: 'auto'}}>
          <table style={{
              borderCollapse: 'collapse',
              width: '100%',
            }}>
            <thead>
              <Th onClick={()=>this.reorder('name')}
                active={this.state.order === 'name'}
                reverse={this.state.reverse}
                label="Name"/>

              <Th onClick={()=>this.reorder('progress')}
                active={this.state.order === 'progress'}
                reverse={this.state.reverse}
                label="Progress"/>

              <Th onClick={()=>this.reorder('download')}
                active={this.state.order === 'download'}
                reverse={this.state.reverse}
                label="Down"/>

              <Th onClick={()=>this.reorder('total')}
                active={this.state.order === 'total'}
                reverse={this.state.reverse}
                label="Size"/>
            </thead>
            {this.state.torrents.sort(this.order()).map(torrent =>
              <Torrent getTorrents={this.getTorrents} torrent={torrent} key={torrent.info_hash}/>
            )}
          </table>
        </div> : <div style={{
          color: subheaderColor,
          padding: '16px',
          textAlign: 'center',
        }}>No torrents. Try adding one!</div>}
      </Card>
    );
  }
}

// Renders a single torrent table row
class Torrent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expand: false,
    };
  }

  render() {
    let torrent = this.props.torrent;
    return (
      <tbody>
        <tr style={{
            backgroundColor: (
              torrent.status === 'downloading' ? blue100 :
              torrent.status === 'seeding' ? green100 :
              grey100
            ),
            cursor: 'pointer',
          }}
          onClick={()=>this.setState({expand: !this.state.expand})}>
          <Td expand>
            {torrent.name}
          </Td>
          <Td center>
            <Progress progress={torrent.progress}/>
          </Td>
          <Td right>
            {torrent.completed}
          </Td>
          <Td right>
            {torrent.size}
          </Td>
        </tr>
        {$if(this.state.expand,
          <tr>
            <td colSpan="4">
              {torrent.files.map(file => {
                let ratio = file.completedChunks / file.totalChunks;
                let link = encodeURI(file.path)
                  .replace(/&/g, '%26')
                  .replace(/;/g, '%3B');
                return <div key={file.name} style={{
                    alignItems: 'center',
                    display: 'flex',
                    padding: '4px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                  }}>
                  <a href={'/api/dl?file=' + link}
                      style={{textDecoration: 'none'}}
                      target="_blank">
                    <IconButton icon="attach_file"/>
                  </a>
                  <span style={{
                      flex: '1',
                      paddingLeft: '8px'
                    }}>
                      <Overflow>{file.name}</Overflow>
                  </span>
                  <span>{$bytes(file.size * ratio)}</span>
                </div>;
              })}
            </td>
          </tr>
        )}
      </tbody>
    );
  }
}

class Users extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
    };

    this.getUsers = this.getUsers.bind(this);
    this.showUserModal = this.showUserModal.bind(this);
  }

  componentDidMount() {
    this.getUsers();
  }

  getUsers() {
    clearTimeout(this.updateTimeout);

    $.ajax({url: '/api/users'})
    .then(users => {
        this.setState({ users });
        this.updateTimeout = setTimeout(() => this.getUsers(), 60 * 1000);
      }, error => {
        $handleError(error);
        this.updateTimeout = setTimeout(() => this.getUsers(), 60 * 1000);
      }
    );
  }

  showUserModal(add, user) {
    return e => {
      user = user || {name: '', email: '', level: 0};
      $openModal(<Modal title={(add ? 'Add' : 'Edit') + ' User'} onClose={$closeModal}>
        <Padding>
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
            onSubmit={e => {
              e.preventDefault();
              if(!e.target.checkValidity())
                return;

              let data = {
                name: e.target.name.value,
                email: e.target.email.value,
                level: e.target.level.value,
              }

              let xhr;

              if(add)
                xhr = $.ajax({url: 'api/users', method: 'POST', data});
              else
                xhr = $.ajax({url: 'api/users/' + user.id, method: 'PUT', data});

              $closeModal();

              xhr.then(this.getUsers, $handleError);

            }}>
            <Input name="name" margin
              type="text"
              placeholder="User Name"
              defaultValue={user.name}
              required={true}/>
            <Input name="email" margin
              type="text"
              defaultValue={user.email}
              hidden={user_level < PERMISSIONS.EDIT_USER}
              placeholder="User Email"
              required={true}/>
            <select name="level"
              className="input"
              style={{
                backgroundColor: cardBg,
                margin: '4px',
              }}
              defaultValue={user.level}
              hidden={user_level < PERMISSIONS.EDIT_USER}
              required={true}>
              <option value="0">Visitor</option>
              <option value="1">Member</option>
              <option value="2">Editor</option>
              <option value="3">Owner</option>
            </select>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit"
                className="primary"
                style={{fontSize: '16px', padding: '8px'}}>
                  {add ? 'CREATE' : 'EDIT'}
              </button>
            </div>
          </form>
        </Padding>
      </Modal>);
    }
  }

  render() {
    return (
      <Card>
        <CardHeader title="Users">
          {$level(PERMISSIONS.EDIT_USER,
            <IconButton icon="add" onClick={this.showUserModal(true)}/>
          )}
          <IconButton icon="refresh" onClick={this.getUsers}/>
        </CardHeader>
        <div style={{paddingBottom: '16px'}}>
          {this.state.users.map(u =>
            <User user={u} key={u.id}
              refresh={this.getUsers}
              showUserModal={this.showUserModal}/>)}
        </div>
      </Card>
    );
  }
}

let User = props => {
  let { user } = props;

  return (
    <div style={{
        borderLeft: 'solid 2px ' + primaryBgColor,
        marginLeft: '16px',
        marginTop: '16px',
        padding: '8px',
      }}>
      <div style={{display: 'flex'}}>
        <div style={{width: '300px'}}>
          <h2 style={{
              fontWeight: '400',
            }}>
            {user.name}
            <span style={{fontSize: '14px'}}>
              &nbsp;{UI_LEVELS[user.level]} #{user.id}
            </span>
          </h2>
          <subhead style={{color: subheaderColor, fontSize: '12px'}}>
            <Overflow>{user.email}</Overflow>
          </subhead>
        </div>
        <div style={{
            flex: '1',
            marginLeft: '8px',
            marginTop: '4px',
          }}>
          <div style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
            Online {$ago(user.last_online)}
          </div>
          <div style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              fontSize: '10px',
            }}>
            {user.subscriptions} Subscriptions
          </div>
        </div>
        {$if(PERMISSIONS.EDIT_USER <= user_level || user.id === user_id,
          <div style={{display: 'flex'}}>
            <IconButton icon="create" onClick={props.showUserModal(false, user)}/>
          </div>
        )}
        {$level(PERMISSIONS.EDIT_USER,
          <div style={{display: 'flex'}}>
            <IconButton icon="delete" onClick={e => {
              $confirmModal('Delete User', `Are you sure you want to delete user "${user.name}"?`)
                .then(() => {
                  $.ajax({method: 'delete', url: '/api/users/' + user.id}).then(props.refresh, $handleError);
                });
            }}/>
          </div>
        )}
      </div>
    </div>
  );
}

// List of Feeds
class Feeds extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      feeds: [],
      listeners: [],
      subscriptions: {},
    };

    this.getFeeds = this.getFeeds.bind(this);
    this.showFeedModal = this.showFeedModal.bind(this);
    this.showListenerModal = this.showListenerModal.bind(this);
  }

  componentDidMount() {
    this.getFeeds();
  }

  getFeeds() {
    clearTimeout(this.updateTimeout);

    $.ajax({url: '/api/feeds'})
    .then(feeds => {
        $.ajax({url: '/api/listeners'})
        .then(listeners => {
            $.ajax({url: '/api/user/listeners'})
            .then(arr => {
                let subscriptions = {};
                arr.forEach(s => subscriptions[s.listener_id] = s);
                this.setState({ listeners, subscriptions, feeds});
                this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
              }, error => {
                $handleError(error);
                this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
              }
            );
          }, error => {
            $handleError(error);
            this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
          }
        );
      }, error => {
        $handleError(error);
        this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
      }
    );
  }

  showFeedModal(add, feed) {
    return e => {
      // I'm so stupid for making my api inconsistent
      feed = feed ?
        {name: feed.name, url: feed.uri, duration: feed.update_duration, id: feed.id} :
        {name: '', url: '', duration: ''};
      $openModal(<Modal title={(add ? 'Add' : 'Edit') + ' Feed'} onClose={$closeModal}>
        <Padding>
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
            onSubmit={e => {
              e.preventDefault();
              if(!e.target.checkValidity())
                return;

              let data = {
                name: e.target.name.value,
                url: e.target.url.value,
                duration: e.target.duration.value,
              }

              let xhr;

              if(add)
                xhr = $.ajax({url: 'api/feeds', method: 'POST', data});
              else
                xhr = $.ajax({url: 'api/feeds/' + feed.id, method: 'PUT', data});

              $closeModal();

              xhr.then(this.getFeeds, $handleError);

            }}>
            <Input name="name" margin
              type="text"
              placeholder="Feed Name"
              defaultValue={feed.name}
              required={true}/>
            <Input name="url" margin
              type="text"
              defaultValue={feed.url}
              placeholder="Feed Url"
              required={true}/>
            <Input name="duration" margin
              type="number"
              defaultValue={feed.duration}
              min="15"
              step="1"
              placeholder="Feed Duration"
              required={true}/>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit"
                className="primary"
                style={{fontSize: '16px', padding: '8px'}}>
                  {add ? 'CREATE' : 'EDIT'}
              </button>
            </div>
          </form>
        </Padding>
      </Modal>);
    }
  }

  showListenerModal(add, feed, listener) {
    return e => {
      // I'm so stupid for making my api inconsistent
      listener = listener || {name: '', pattern: ''};
      $openModal(<Modal title={(add ? 'Add' : 'Edit') + ' Listener'} onClose={$closeModal}>
        <Padding>
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
            onSubmit={e => {
              e.preventDefault();
              if(!e.target.checkValidity())
                return;

              let data = {
                feed_id: feed.id,
                name: e.target.name.value,
                pattern: e.target.pattern.value,
              }

              let xhr;

              if(add)
                xhr = $.ajax({url: 'api/listeners', method: 'POST', data});
              else
                xhr = $.ajax({url: 'api/listeners/' + listener.id, method: 'PUT', data});

              $closeModal();

              xhr.then(this.getFeeds, $handleError);

            }}>
            <Input name="name" margin
              type="text"
              placeholder="Listener Name"
              defaultValue={listener.name}
              required={true}/>
            <Input name="pattern" margin
              type="text"
              defaultValue={listener.pattern}
              placeholder="Listener Pattern"
              required={true}/>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit"
                className="primary"
                style={{fontSize: '16px', padding: '8px'}}>
                  {add ? 'CREATE' : 'EDIT'}
              </button>
            </div>
          </form>
        </Padding>
      </Modal>);
    }
  }

  render() {
    return (
      <Card>
        <CardHeader title="Feeds">
          {$level(PERMISSIONS.EDIT_FEED,
            <IconButton icon="add" onClick={this.showFeedModal(true)}/>
          )}
          <IconButton icon="refresh" onClick={this.getFeeds}/>
        </CardHeader>
        <div style={{paddingBottom: '16px'}}>
          {this.state.feeds.map(f =>
            <Feed feed={f} key={f.id}
              listeners={this.state.listeners}
              refresh={this.getFeeds}
              showFeedModal={this.showFeedModal}
              showListenerModal={this.showListenerModal}
              subscriptions={this.state.subscriptions}/>)}
        </div>
      </Card>
    );
  }
}

// Feed in the list of feeds
let Feed = props => {
  let { feed } = props;

  return (
    <div style={{
        borderLeft: 'solid 2px ' + primaryBgColor,
        marginLeft: '16px',
        marginTop: '16px',
        padding: '8px',
      }}>
      <div style={{display: 'flex'}}>
        <div style={{flex: '1'}}>
          <h2>
            {feed.name}
            <span style={{fontSize: '14px'}}>
              &nbsp;by {feed.creator_name}
            </span>
          </h2>
          <subhead style={{color: subheaderColor, fontSize: '12px'}}>
            <Overflow>{feed.uri}</Overflow>
          </subhead>
        </div>
        {$level(PERMISSIONS.EDIT_LISTENER,
          <div style={{display: 'flex'}}>
            <IconButton icon="playlist_add" onClick={props.showListenerModal(true, feed)}/>
          </div>
        )}
        {$level(PERMISSIONS.EDIT_FEED,
          <div style={{display: 'flex'}}>
            <IconButton icon="create" onClick={props.showFeedModal(false, feed)}/>
            <IconButton icon="delete" onClick={e => {
              $confirmModal('Delete Feed', `Are you sure you want to delete feed "${feed.name}"?`)
                .then(() => {
                  $.ajax({method: 'delete', url: '/api/feeds/' + feed.id}).then(props.refresh, $handleError);
                });
            }}/>
          </div>
        )}
      </div>
      <div>
        {$filter(props.listeners, l => l.feed_id == feed.id ).map(l =>
          <div style={{
              alignItems: 'center',
              display: 'flex',
            }}>
            <IconButton icon={props.subscriptions[l.id] ? 'star' : 'star_border'}
              onClick={e =>
                $.ajax({
                  url: 'api/user/listeners' + (props.subscriptions[l.id] ? '/' + l.id : ''),
                  method: (props.subscriptions[l.id] ? 'delete' : 'post'),
                  data: {listener_id: l.id},
                }).then(props.refresh, $handleError)
              }/>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '300px',
                marginLeft: '8px',
                marginTop: '4px',
              }}>
              <Overflow height='15px'>{l.name}</Overflow>
              <Overflow>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  }}>
                  /{l.pattern}/i
                </span>
              </Overflow>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                marginLeft: '8px',
                marginTop: '4px',
              }}>
              <div style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}>
                {$ago(l.last_update)}
              </div>
              <div style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  fontSize: '10px',
                }}>
                {l.subscribers} Subscribers
              </div>
            </div>
            {$level(PERMISSIONS.EDIT_LISTENER,
              <div style={{display: 'flex'}}>
                <IconButton icon="create" onClick={props.showListenerModal(false, feed, l)}/>
                <IconButton icon="delete" onClick={e => {
                  $confirmModal('Delete Listener', `Are you sure you want to delete listener "${l.name}"?`)
                    .then(() => {
                      $.ajax({method: 'delete', url: '/api/listeners/' + l.id}).then(props.refresh, $handleError);
                    });
                }}/>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Emby iframe
let Emby = props => (
  <iframe style={{
      border: 'none',
      flex: '1',
    }}
    src="/mb/web/index.html"
    allowFullScreen={true}>
  </iframe>
);

// Rutorrent iframe
let RuTorrent = props => (
  <iframe style={{
      border: 'none',
      flex: '1',
    }}
    src="/rutorrent/"
    allowFullScreen={true}>
  </iframe>
);

/*
  A colored toolbar
  <Toolbar
    title="string"> // Title of the toolbar
      ...           // Other components in the toolbar
  </Toolbar>
*/
let Toolbar = props =>(
  <div style={{
    alignItems: 'center',
    backgroundColor: primaryBgColor,
    color: primaryFgColor,
    display: 'flex',
    flexDirection: 'row',
    height: '48px',
    paddingRight: '20px',
    paddingLeft: '20px',
  }}>
    <h2 style={{
        cursor: 'pointer',
      }}
      className="toolbar-title"
      onClick={()=>location.hash="#/"}>
      {props.title}
    </h2>
    {props.children}
  </div>
);

/*
  Basic material icon
  <Icon
    style={object}> // Component styling
    icon_label      // Icon label
  </Icon>
*/
let Icon = props => (
  <i className="material-icons" style={props.style}>
    {props.children}
  </i>
);

/*
  Used as a button

  <IconButton
    onClick={fn} // Click handler
    submit       // form submit
    primary      // add primary class
    /> 
*/
let IconButton = props => (
  <div style={{alignItems: 'center', display: 'flex'}}>
    <button
      onClick={props.onClick}
      type={$hasProp(props, 'submit') ? 'submit' : null}
      className={'icon-button' + ($hasProp(props, 'primary') ? ' primary' : '')}
      {...props}>
      <Icon>{props.icon}</Icon>
    </button>
  </div>
);

/*
  <Chip
    onClick={fn}    // chip click function
    icon="icon">    // chip icon
    ...             // chip text
  </Chip>
*/
let Chip = props => (
  <div className={'chip' + (props.primary ? ' primary' : '')} onClick={props.onClick} style={{
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      height: '32px',
      borderRadius: '16px',
      paddingLeft: '8px',
      paddingRight: '8px',
    }}>
    <span style={{flex: '1'}}>{props.children}</span>
    <Icon style={{marginLeft: '4px'}}>{props.icon}</Icon>
  </div>
)

/*
  Used as a button that opens an input

  <AddButton
    placeholder="string" // Input placeholder
    onSubmit={fn}        // Return function
    icon="string"        // Button icon, default is "add"
*/
class AddButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
    };

    this.submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    let result = event.target.field.value;
    event.target.field.value = "";
    this.setState({show: false});
    if(this.props.onSubmit)
      this.props.onSubmit(result);
  }

  render() {
    return <div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
      }}>
      {$if(this.state.show,
        <form onSubmit={this.submit} style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
        }}>
          <Input placeholder={this.props.placeholder} pattern={this.props.pattern} name="field"/>
            <IconButton icon={this.props.icon || "add"} submit/>
        </form>
      )}
      {$if(!this.state.show, 
        <IconButton icon={this.props.icon || "add"} onClick={
          () => this.setState({show: true})
        }/>
      )}
    </div>
  }
}

class PopupButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
    };
    this.open = this.open.bind(this);
  }

  open(event) {
    this.setState({open: true});

    let { id, title, children } = this.props;
    $(`<div id="${id}" style="display:flex;flex-direction:column;"/>`).dialog({
      resizable: false,
      title: title,
      open(e) {
        ReactDOM.render(<div>{children}</div>, $('#' + id)[0]);
      }
    }).on('dialogclose', e => {
      ReactDOM.unmountComponentAtNode($('#' + id)[0]);
      $('#' + id).remove();
      this.setState({open: false});
    });
  }

  render() {
    return $if(!this.state.open, <IconButton icon={this.props.icon} primary onClick={this.open}/>);
  }
}

let Input = props => (
  <input
    className={'input ' + (props.className || '')}
    style={{
      margin: $hasProp(props, 'margin') ? '4px' : '',
    }}
    {...props}/>
);

/*
  <Card
    nostretch>          // prevents the card from taking up the entire width
    nostretch="100px">  // changes the given width of the card
    ...
  </Card>
    Basic card container
*/
let Card = props => (
  <div style={{
      backgroundColor: cardBg,
      // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
      margin: '16px',
      flex: '1',
      maxWidth: $hasProp(props, 'nostretch') ? (props.nostretch || 'auto') :
        'calc(100vw - 32px)',
    }}>
    {props.children}
  </div>
);

/*
  Padding for layout
    <Padding> ... </Padding>
*/
let Padding = props => <div style={{padding: '16px'}} {...props}>{props.children}</div>;

/*
  Modal Container for a Card
  <Modal
    title="string"    // title of modal
    onClose={fn}>     // on close callback, must hide the modal
    ...               // modal card content
  </Modal>
*/
let Modal = props => (
  <div style={{
      alignItems: 'center',
      display: 'flex',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      left: '0',
      top: '0',
      width: '100vw',
    }} data-wall onClick={(e)=>{
      if($(e.target).attr('data-wall') && props.onClose)
        props.onClose(e);
    }}>
    <Card nostretch="300px" onClick={e=>e.preventDefault()} style={{zIndex: '5'}}>
      <CardHeader title={props.title}>
        {$if(props.onClose, <IconButton icon="close" onClick={props.onClose}/>)}
      </CardHeader>
      {props.children}
    </Card>
  </div>
);

/*
  Used with <Card/> for a header
  <CardHeader>
    title="string"> // Title of the card
    ...             // ... Things to put on the right
  </CardHeader>
*/
let CardHeader = props => (
  <div style={{
      alignItems: 'center',
      display: 'flex',
      height: '48px',
      paddingLeft: '16px',
      paddingRight: '8px',
    }}>
    <h2 style={{
        flex: '1',
      }}>
      {props.title}
    </h2>
    <div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}>
      {props.children}
    </div>
  </div>
);

/*
  Table header that supports sorting
  <Th
    onClick={fn}      // Click handler
    active={boolean}  // True if last selected
    label="string"    // Text content
    reverse={boolean} // If the sort icon is reversed
    nosort            // Disables the sort icon
    />
*/
let Th = props => (
  <th
    onClick={props.onClick}
    style={{
      cursor: $hasProp(props, 'nosort') ? '' : 'pointer',
      fontSize: '0.8em',
      fontWeight: 400,
    }}>
    <span style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
      }}>
      {props.label}
      {$if(!$hasProp(props, 'nosort'),
        <Icon style={props.active ? {
            color: subheaderColor,
            transition: 'all 0.5s ease',
          } : {
            color: 'transparent',
            transition: 'all 0.5s ease',
          }}>
          { props.reverse && props.active ? 'expand_more' : 'expand_less' }
        </Icon>
      )}
    </span>
  </th>
);

/*
  Table cell element
  <Td
    left   // justify text left
    right  // justify text right
    center // justify text center
    expand // take up extra space
    >
    ...    // Cell contents
  </Td>
*/
let Td = props => (
  <td style={{
      padding: '4px',
      whiteSpace: 'nowrap',
      overflow: $hasProp(props, 'expand') ? 'hidden' : '',
      width: $hasProp(props, 'expand') ? '100%' : 'auto',
      position: 'relative',
      textAlign: 
        $hasProp(props, 'left') ? 'left' : 
        $hasProp(props, 'center') ? 'center' : 
        $hasProp(props, 'right') ? 'right' : '',
      textOverflow: 'elipsis',
    }}>
    <span style={{
      transition: 'margin-left 1s ease',
      top: $hasProp(props, 'expand') ? '4px' : '0',
      position: $hasProp(props, 'expand') ? 'absolute' : 'relative',
    }} onMouseOver={e => {
      let width = $(e.target).width();
      let maxWidth = $(e.target).parent().width();
      if(width <= maxWidth)
        return;
      $(e.target).css({
        marginLeft: '-'+(width-maxWidth)+'px',
      })
    }} onMouseLeave={e => {
      $(e.target).css({
        marginLeft: '0px',
      })
    }}>{props.children}</span>
  </td>
);

/*
  Overflow autos hides text that overflows
    when a user hovers over the text, it shows the rest

  <Overflow
    height="10px">   // height of component
    ...              // content to overflow
  </Overflow>
*/
let Overflow = props => (
  <span style={{
    display: 'flex',
    height: props.height || '20px',
    overflow: 'hidden',
    position: 'relative',
    textOverflow: 'elipsis',
    whiteSpace: 'nowrap',
  }}>
    <span style={{
      transition: 'margin-left 1s ease',
      position: 'absolute',
    }} onMouseOver={e => {
      let width = $(e.target).width();
      let maxWidth = $(e.target).parent().width();
      if(width <= maxWidth)
        return;
      $(e.target).css({
        marginLeft: '-'+(width-maxWidth)+'px',
      })
    }} onMouseLeave={e => {
      $(e.target).css({
        marginLeft: '0px',
      })
    }}>{props.children}</span>
  </span>
);

/*
  A neat progress bar
  <Progress
    progress={Number} // progress range 0..100.0
    width={"string"}  // width, default is '80px'
*/
let Progress = props => {
  let percent = props.progress;
  return (
    <div style={{
        backgroundColor: subheaderColor,
        position: 'relative',
        height: '20px',
        width: props.width || '80px',
      }}>
      <div style={{
          color: primaryFgColor,
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
        {Math.round(percent)}%
      </div>
      <div style={{
        backgroundColor: accentColor,
        height: '100%',
        width: percent + '%',
      }}></div>
    </div>
  );
}

/*
  A row that allows flexing typically used in headers
  <HeaderRow
    flex>     // Should this component flex
      ...     // Content of the component
  </HeaderRow>
*/
let HeaderRow = props => (
  <div style={{
      alignItems: 'center',
      display: 'flex',
      flex: $hasProp(props, 'flex') ? '1' : '',
      justifyContent: 'center',
    }}>
    {props.children}
  </div>
);


/*
  A space filler for flex components, Functionally a div
  <Flex/>
*/
let Flex = props => <div style={{flex: 1}}>{props.children}</div>;

// Finally render our component
ReactDOM.render(<Seedbox/>, $('#root')[0]);