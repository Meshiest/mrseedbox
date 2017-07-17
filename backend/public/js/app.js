var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
const OWNER_LEVEL = 3;
const EDITOR_LEVEL = 2;
const MEMBER_LEVEL = 1;
const VISITOR_LEVEL = 0;
const UI_LEVELS = {
  3: "Owner",
  2: "Editor",
  1: "Member",
  0: "Visitor"
};
const PERMISSIONS = {
  EDIT_USER: 3,
  READ_USER: 1,
  EDIT_FEED: 2,
  READ_FEED: 0,
  EDIT_LISTENER: 1,
  READ_LISTENER: 0,
  EDIT_TORRENT: 1,
  READ_TORRENT: 0,
  EDIT_SUBSCRIPTION: 0,
  READ_SUBSCRIPTION: 0,
  OWNER_LEVEL: 3,
  EDITOR_LEVEL: 2,
  MEMBER_LEVEL: 1,
  VISITOR_LEVEL: 0
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
  if (bytes < 1024) return bytes + ' B';else if (bytes < 1048576) return ~~(bytes / 1024).toFixed(3) + ' KB';else if (bytes < 1073741824) return ~~(bytes / 1048576).toFixed(3) + ' MB';else return ~~(bytes / 1073741824).toFixed(3) + ' GB';
}

/*
  Refreshes the page when a user has invalid authorization
*/
function $handleError(err) {
  if (err && err.status === 401) location.reload();
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
    $openModal(React.createElement(
      Modal,
      { title: title, onClose: e => {
          $closeModal();
          reject();
        } },
      React.createElement(
        Padding,
        { style: { display: 'flex', flexDirection: 'column' } },
        React.createElement(
          Padding,
          null,
          text
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'flex-end', padding: '16px' } },
          React.createElement(
            'button',
            { type: 'submit',
              style: { fontSize: '16px', padding: '8px' },
              onClick: e => {
                $closeModal();
                reject();
              } },
            'No'
          ),
          React.createElement(
            'button',
            { type: 'submit',
              className: 'primary',
              style: { fontSize: '16px', padding: '8px' },
              onClick: e => {
                $closeModal();
                resolve();
              } },
            'Yes'
          )
        )
      )
    ));
  });
}

/*
  String - A smart timestamp function given a unix time in seconds
*/
function $ago(time) {
  var now = Date.now() / 1000;
  var delta = now - time;
  if (!time) return 'Never';
  if (delta < 0) return 'In The Future';
  if (delta < 10) return 'Now';
  if (delta < 60) return 'Moments Ago';
  if (delta < 60 * 60) return Math.round(delta / 60) + ' Minute' + (Math.round(delta / 60) != 1 ? 's' : '') + ' Ago';
  if (delta < 60 * 60 * 24) return Math.round(delta / 60 / 60) + ' Hour' + (Math.round(delta / 60 / 60) != 1 ? 's' : '') + ' Ago';
  if (delta < 60 * 60 * 24 * 7) return Math.round(delta / 60 / 60 / 24) + ' Day' + (Math.round(delta / 60 / 60 / 24) != 1 ? 's' : '') + ' Ago';
  if (delta < 60 * 60 * 24 * 30) return Math.round(delta / 60 / 60 / 24 / 7) + ' Week' + (Math.round(delta / 60 / 60 / 24 / 7) != 1 ? 's' : '') + ' Ago';

  let date = new Date(time);
  let month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()}`;
}

/*
  Array - Filters out the given array with the function `fn`
*/
function $filter(arr, fn) {
  let newArr = [];
  arr.forEach(a => {
    if (fn(a)) newArr.push(a);
  });
  return newArr;
}

// Core app component
class Seedbox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement(
      'div',
      { className: 'mrseedbox',
        style: {
          backgroundColor: bgColor,
          display: 'flex',
          flexDirection: 'column'
        } },
      React.createElement(
        Toolbar,
        { title: 'MrSeedbox' },
        React.createElement(
          HeaderRow,
          { flex: true },
          React.createElement(IconButton, { primary: true,
            icon: 'home',
            onClick: $to('') }),
          $level(PERMISSIONS.READ_TORRENT, React.createElement(IconButton, { primary: true,
            icon: 'video_library',
            onClick: $to('emby') })),
          $level(EDITOR_LEVEL, React.createElement(IconButton, { primary: true,
            icon: 'file_download',
            onClick: $to('rutorrent') }))
        ),
        React.createElement(
          HeaderRow,
          null,
          React.createElement(PopupButton, { title: 'Animelist',
            icon: 'list',
            id: 'popup-animelist' }),
          React.createElement(PopupButton, { title: 'Chat',
            icon: 'chat',
            id: 'popup-chat' }),
          React.createElement(
            PopupButton,
            { title: 'Subscriptions',
              icon: 'stars',
              id: 'popup-subscriptions' },
            React.createElement(Subscriptions, null)
          )
        )
      ),
      React.createElement(
        HashRouter,
        null,
        React.createElement(
          Switch,
          null,
          React.createElement(Route, { exact: true, path: '/', component: Home }),
          $level(PERMISSIONS.READ_TORRENT, React.createElement(Route, { exact: true, path: '/emby', component: Emby })),
          $level(EDITOR_LEVEL, React.createElement(Route, { exact: true, path: '/rutorrent', component: RuTorrent }))
        )
      )
    );
  }
};

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement(
      'div',
      null,
      React.createElement(Dashboard, null),
      React.createElement(Feeds, null),
      $level(PERMISSIONS.READ_USER, React.createElement(Users, null)),
      React.createElement(Torrents, null)
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
      email: user_email
    };

    let welcome = this.getWelcome();
    this.state = {
      user,
      welcome,
      listeners: {},
      subscriptions: []
    };

    this.updateListeners = this.updateListeners.bind(this);
    this.updateListeners();

    // get a new welcome every minute or so
    this.welcomeInterval = setInterval(() => {
      this.setState({ welcome: this.getWelcome() });
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
        subscriptions = $filter(subscriptions, s => typeof s.last_seen === 'undefined' || s.last_seen < listeners[s.listener_id].last_update);
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
    let hours = time.getHours(),
        mins = time.getMinutes();

    if (5 <= hours && hours <= 8) welcome = 'Good Morning';

    if (hours > 8 && hours < 12) welcome = 'Top of the Morning';

    if (hours === 12 && mins <= 5) welcome = 'It\'s High Noon';else if (hours >= 12 && hours <= 17) welcome = 'Good Afternoon';

    if (hours > 17 && hours <= 21) welcome = 'Good Evening';

    if (hours > 21 || hours < 5) welcome = 'Good Night';

    return welcome;
  }

  render() {
    let { user, welcome } = this.state;
    return React.createElement(
      'div',
      { style: {
          alignItems: 'center',
          color: subheaderColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        } },
      React.createElement(
        'h2',
        { style: {
            fontWeight: 400,
            marginTop: '16px'
          } },
        welcome,
        ', ',
        user.name
      ),
      React.createElement(
        'subhead',
        { style: {
            fontSize: '12px'
          } },
        user.email
      ),
      React.createElement(
        'sup',
        { style: { fontSize: '12px', marginBottom: '8px' } },
        UI_LEVELS[user_level],
        ' #',
        user_id
      ),
      $if(this.state.subscriptions.length, React.createElement(
        'div',
        { style: {
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          } },
        React.createElement(
          'h2',
          { style: {
              fontWeight: 400,
              marginBottom: '8px',
              marginTop: '16px'
            } },
          'You Have New Updates'
        ),
        React.createElement(
          'div',
          { style: {
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              maxWidth: '300px',
              alignItems: 'center',
              justifyContent: 'center'
            } },
          this.state.subscriptions.map(s => React.createElement(
            Chip,
            { primary: true, icon: 'visibility', key: s.listener_id, onClick: e => {
                let time = Math.floor(Date.now() / 1000);
                $.ajax({
                  url: `/api/user/listeners/${s.listener_id}`,
                  method: 'PUT',
                  data: { time }
                }).then(this.updateListeners, $handleError);
              } },
            this.state.listeners[s.listener_id].name
          ))
        )
      )),
      React.createElement(IconButton, { icon: 'exit_to_app', style: {
          position: 'absolute',
          right: '0',
          top: '48px'
        }, onClick: () => $.ajax('/logout').then(e => location.reload(), e => location.reload()) })
    );
  }
}

class Subscriptions extends Dashboard {
  constructor(props) {
    super(props);

    this.state = {
      subscriptions: [],
      listeners: {}
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
    return React.createElement(
      Padding,
      null,
      $if(!this.state.subscriptions.length, React.createElement(
        'h2',
        { style: {
            alignItems: 'center',
            color: subheaderColor,
            display: 'flex',
            flexDirection: 'column',
            fontWeight: '400',
            justifyContent: 'center',
            marginTop: '20px'
          } },
        React.createElement(
          'span',
          null,
          'No Subscriptions'
        ),
        React.createElement(
          Icon,
          null,
          'mood_bad'
        )
      )),
      this.state.subscriptions.sort((a, b) => (b.unseen ? 1 : 0) - (a.unseen ? 1 : 0)).map(s => {
        return React.createElement(
          Chip,
          { primary: s.unseen, icon: 'visibility' + (s.unseen ? '' : '_off'), key: s.listener_id, onClick: e => {
              let time = s.unseen ? Math.floor(Date.now() / 1000) : this.state.listeners[s.listener_id].last_update - 5;
              $.ajax({
                url: `/api/user/listeners/${s.listener_id}`,
                method: 'PUT',
                data: { time }
              }).then(this.updateListeners, $handleError);
            } },
          this.state.listeners[s.listener_id].name
        );
      })
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
      reverse: true
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
    for (var i in torrent.files) {
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

    $.ajax({ url: '/api/torrents' }).then(torrents => {
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
      this.setState({ torrents });
      this.updateTimeout = setTimeout(() => this.getTorrents(), 5000);
    }, error => {
      $handleError(error);
      this.updateTimeout = setTimeout(() => this.getTorrents(), 300000);
    });
  }

  order() {
    let { order, reverse } = this.state;
    reverse = reverse ? -1 : 1;
    return (a, b) => reverse * (typeof a[order] === 'string' ? a[order].localeCompare(b[order]) : a[order] - b[order]);
  }

  reorder(order) {
    if (this.state.order === order) this.setState({ reverse: !this.state.reverse });else this.setState({ order, reverse: false });
  }

  render() {
    return React.createElement(
      Card,
      null,
      React.createElement(
        CardHeader,
        { title: 'Torrents' },
        $level(PERMISSIONS.EDIT_TORRENT, React.createElement(AddButton, { placeholder: 'Torrent or Magnet Link',
          onSubmit: result => {
            $.ajax({
              method: 'post',
              url: '/api/torrents?url=' + result
            }).then(resp => {
              this.getTorrents();
            }, $handleError);
          } })),
        React.createElement(IconButton, { icon: 'refresh', onClick: this.getTorrents })
      ),
      this.state.torrents.length ? React.createElement(
        'div',
        { style: { overflow: 'auto' } },
        React.createElement(
          'table',
          { style: {
              borderCollapse: 'collapse',
              width: '100%'
            } },
          React.createElement(
            'thead',
            null,
            React.createElement(Th, { onClick: () => this.reorder('name'),
              active: this.state.order === 'name',
              reverse: this.state.reverse,
              label: 'Name' }),
            React.createElement(Th, { onClick: () => this.reorder('progress'),
              active: this.state.order === 'progress',
              reverse: this.state.reverse,
              label: 'Progress' }),
            React.createElement(Th, { onClick: () => this.reorder('download'),
              active: this.state.order === 'download',
              reverse: this.state.reverse,
              label: 'Down' }),
            React.createElement(Th, { onClick: () => this.reorder('total'),
              active: this.state.order === 'total',
              reverse: this.state.reverse,
              label: 'Size' })
          ),
          this.state.torrents.sort(this.order()).map(torrent => React.createElement(Torrent, { getTorrents: this.getTorrents, torrent: torrent, key: torrent.info_hash }))
        )
      ) : React.createElement(
        'div',
        { style: {
            color: subheaderColor,
            padding: '16px',
            textAlign: 'center'
          } },
        'No torrents. Try adding one!'
      )
    );
  }
}

// Renders a single torrent table row
class Torrent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expand: false
    };
  }

  render() {
    let torrent = this.props.torrent;
    return React.createElement(
      'tbody',
      null,
      React.createElement(
        'tr',
        { style: {
            backgroundColor: torrent.status === 'downloading' ? blue100 : torrent.status === 'seeding' ? green100 : grey100,
            cursor: 'pointer'
          },
          onClick: () => this.setState({ expand: !this.state.expand }) },
        React.createElement(
          Td,
          { expand: true },
          torrent.name
        ),
        React.createElement(
          Td,
          { center: true },
          React.createElement(Progress, { progress: torrent.progress })
        ),
        React.createElement(
          Td,
          { right: true },
          torrent.completed
        ),
        React.createElement(
          Td,
          { right: true },
          torrent.size
        )
      ),
      $if(this.state.expand, React.createElement(
        'tr',
        null,
        React.createElement(
          'td',
          { colSpan: '4' },
          torrent.files.map(file => {
            let ratio = file.completedChunks / file.totalChunks;
            let link = encodeURI(file.path).replace(/&/g, '%26').replace(/;/g, '%3B');
            return React.createElement(
              'div',
              { key: file.name, style: {
                  alignItems: 'center',
                  display: 'flex',
                  padding: '4px',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                } },
              React.createElement(
                'a',
                { href: '/api/dl?file=' + link,
                  style: { textDecoration: 'none' },
                  target: '_blank' },
                React.createElement(IconButton, { icon: 'attach_file' })
              ),
              React.createElement(
                'span',
                { style: {
                    flex: '1',
                    paddingLeft: '8px'
                  } },
                React.createElement(
                  Overflow,
                  null,
                  file.name
                )
              ),
              React.createElement(
                'span',
                null,
                $bytes(file.size * ratio)
              )
            );
          })
        )
      ))
    );
  }
}

class Users extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: []
    };

    this.getUsers = this.getUsers.bind(this);
    this.showUserModal = this.showUserModal.bind(this);
  }

  componentDidMount() {
    this.getUsers();
  }

  getUsers() {
    clearTimeout(this.updateTimeout);

    $.ajax({ url: '/api/users' }).then(users => {
      this.setState({ users });
      this.updateTimeout = setTimeout(() => this.getUsers(), 60 * 1000);
    }, error => {
      $handleError(error);
      this.updateTimeout = setTimeout(() => this.getUsers(), 60 * 1000);
    });
  }

  showUserModal(add, user) {
    return e => {
      user = user || { name: '', email: '', level: 0 };
      $openModal(React.createElement(
        Modal,
        { title: (add ? 'Add' : 'Edit') + ' User', onClose: $closeModal },
        React.createElement(
          Padding,
          null,
          React.createElement(
            'form',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              },
              onSubmit: e => {
                e.preventDefault();
                if (!e.target.checkValidity()) return;

                let data = {
                  name: e.target.name.value,
                  email: e.target.email.value,
                  level: e.target.level.value
                };

                let xhr;

                if (add) xhr = $.ajax({ url: 'api/users', method: 'POST', data });else xhr = $.ajax({ url: 'api/users/' + user.id, method: 'PUT', data });

                $closeModal();

                xhr.then(this.getUsers, $handleError);
              } },
            React.createElement(Input, { name: 'name', margin: true,
              type: 'text',
              placeholder: 'User Name',
              defaultValue: user.name,
              required: true }),
            React.createElement(Input, { name: 'email', margin: true,
              type: 'text',
              defaultValue: user.email,
              hidden: user_level < PERMISSIONS.EDIT_USER,
              placeholder: 'User Email',
              required: true }),
            React.createElement(
              'select',
              { name: 'level',
                className: 'input',
                style: {
                  backgroundColor: cardBg,
                  margin: '4px'
                },
                defaultValue: user.level,
                hidden: user_level < PERMISSIONS.EDIT_USER,
                required: true },
              React.createElement(
                'option',
                { value: '0' },
                'Visitor'
              ),
              React.createElement(
                'option',
                { value: '1' },
                'Member'
              ),
              React.createElement(
                'option',
                { value: '2' },
                'Editor'
              ),
              React.createElement(
                'option',
                { value: '3' },
                'Owner'
              )
            ),
            React.createElement(
              'div',
              { style: { display: 'flex', justifyContent: 'flex-end' } },
              React.createElement(
                'button',
                { type: 'submit',
                  className: 'primary',
                  style: { fontSize: '16px', padding: '8px' } },
                add ? 'CREATE' : 'EDIT'
              )
            )
          )
        )
      ));
    };
  }

  render() {
    return React.createElement(
      Card,
      null,
      React.createElement(
        CardHeader,
        { title: 'Users' },
        $level(PERMISSIONS.EDIT_USER, React.createElement(IconButton, { icon: 'add', onClick: this.showUserModal(true) })),
        React.createElement(IconButton, { icon: 'refresh', onClick: this.getUsers })
      ),
      React.createElement(
        'div',
        { style: { paddingBottom: '16px' } },
        this.state.users.map(u => React.createElement(User, { user: u, key: u.id,
          refresh: this.getUsers,
          showUserModal: this.showUserModal }))
      )
    );
  }
}

let User = props => {
  let { user } = props;

  return React.createElement(
    'div',
    { style: {
        borderLeft: 'solid 2px ' + primaryBgColor,
        marginLeft: '16px',
        marginTop: '16px',
        padding: '8px'
      } },
    React.createElement(
      'div',
      { style: { display: 'flex' } },
      React.createElement(
        'div',
        { style: { flex: '1' } },
        React.createElement(
          'h2',
          { style: {
              fontWeight: '400'
            } },
          user.name,
          React.createElement(
            'span',
            { style: { fontSize: '14px' } },
            '\xA0',
            UI_LEVELS[user.level],
            ' #',
            user.id
          )
        ),
        React.createElement(
          'subhead',
          { style: { color: subheaderColor, fontSize: '12px' } },
          React.createElement(
            Overflow,
            null,
            user.email
          )
        )
      ),
      $if(PERMISSIONS.EDIT_USER <= user_level || user.id === user_id, React.createElement(
        'div',
        { style: { display: 'flex' } },
        React.createElement(IconButton, { icon: 'create', onClick: props.showUserModal(false, user) })
      )),
      $level(PERMISSIONS.EDIT_USER, React.createElement(
        'div',
        { style: { display: 'flex' } },
        React.createElement(IconButton, { icon: 'delete', onClick: e => {
            $confirmModal('Delete User', `Are you sure you want to delete user "${user.name}"?`).then(() => {
              $.ajax({ method: 'delete', url: '/api/users/' + user.id }).then(props.refresh, $handleError);
            });
          } })
      ))
    )
  );
};

// List of Feeds
class Feeds extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      feeds: [],
      listeners: [],
      subscriptions: {}
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

    $.ajax({ url: '/api/feeds' }).then(feeds => {
      $.ajax({ url: '/api/listeners' }).then(listeners => {
        $.ajax({ url: '/api/user/listeners' }).then(arr => {
          let subscriptions = {};
          arr.forEach(s => subscriptions[s.listener_id] = s);
          this.setState({ listeners, subscriptions, feeds });
          this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
        }, error => {
          $handleError(error);
          this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
        });
      }, error => {
        $handleError(error);
        this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
      });
    }, error => {
      $handleError(error);
      this.updateTimeout = setTimeout(() => this.getFeeds(), 60 * 1000);
    });
  }

  showFeedModal(add, feed) {
    return e => {
      // I'm so stupid for making my api inconsistent
      feed = feed ? { name: feed.name, url: feed.uri, duration: feed.update_duration, id: feed.id } : { name: '', url: '', duration: '' };
      $openModal(React.createElement(
        Modal,
        { title: (add ? 'Add' : 'Edit') + ' Feed', onClose: $closeModal },
        React.createElement(
          Padding,
          null,
          React.createElement(
            'form',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              },
              onSubmit: e => {
                e.preventDefault();
                if (!e.target.checkValidity()) return;

                let data = {
                  name: e.target.name.value,
                  url: e.target.url.value,
                  duration: e.target.duration.value
                };

                let xhr;

                if (add) xhr = $.ajax({ url: 'api/feeds', method: 'POST', data });else xhr = $.ajax({ url: 'api/feeds/' + feed.id, method: 'PUT', data });

                $closeModal();

                xhr.then(this.getFeeds, $handleError);
              } },
            React.createElement(Input, { name: 'name', margin: true,
              type: 'text',
              placeholder: 'Feed Name',
              defaultValue: feed.name,
              required: true }),
            React.createElement(Input, { name: 'url', margin: true,
              type: 'text',
              defaultValue: feed.url,
              placeholder: 'Feed Url',
              required: true }),
            React.createElement(Input, { name: 'duration', margin: true,
              type: 'number',
              defaultValue: feed.duration,
              min: '15',
              step: '1',
              placeholder: 'Feed Duration',
              required: true }),
            React.createElement(
              'div',
              { style: { display: 'flex', justifyContent: 'flex-end' } },
              React.createElement(
                'button',
                { type: 'submit',
                  className: 'primary',
                  style: { fontSize: '16px', padding: '8px' } },
                add ? 'CREATE' : 'EDIT'
              )
            )
          )
        )
      ));
    };
  }

  showListenerModal(add, feed, listener) {
    return e => {
      // I'm so stupid for making my api inconsistent
      listener = listener || { name: '', pattern: '' };
      $openModal(React.createElement(
        Modal,
        { title: (add ? 'Add' : 'Edit') + ' Listener', onClose: $closeModal },
        React.createElement(
          Padding,
          null,
          React.createElement(
            'form',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              },
              onSubmit: e => {
                e.preventDefault();
                if (!e.target.checkValidity()) return;

                let data = {
                  feed_id: feed.id,
                  name: e.target.name.value,
                  pattern: e.target.pattern.value
                };

                let xhr;

                if (add) xhr = $.ajax({ url: 'api/listeners', method: 'POST', data });else xhr = $.ajax({ url: 'api/listeners/' + listener.id, method: 'PUT', data });

                $closeModal();

                xhr.then(this.getFeeds, $handleError);
              } },
            React.createElement(Input, { name: 'name', margin: true,
              type: 'text',
              placeholder: 'Listener Name',
              defaultValue: listener.name,
              required: true }),
            React.createElement(Input, { name: 'pattern', margin: true,
              type: 'text',
              defaultValue: listener.pattern,
              placeholder: 'Listener Pattern',
              required: true }),
            React.createElement(
              'div',
              { style: { display: 'flex', justifyContent: 'flex-end' } },
              React.createElement(
                'button',
                { type: 'submit',
                  className: 'primary',
                  style: { fontSize: '16px', padding: '8px' } },
                add ? 'CREATE' : 'EDIT'
              )
            )
          )
        )
      ));
    };
  }

  render() {
    return React.createElement(
      Card,
      null,
      React.createElement(
        CardHeader,
        { title: 'Feeds' },
        $level(PERMISSIONS.EDIT_FEED, React.createElement(IconButton, { icon: 'add', onClick: this.showFeedModal(true) })),
        React.createElement(IconButton, { icon: 'refresh', onClick: this.getFeeds })
      ),
      React.createElement(
        'div',
        { style: { paddingBottom: '16px' } },
        this.state.feeds.map(f => React.createElement(Feed, { feed: f, key: f.id,
          listeners: this.state.listeners,
          refresh: this.getFeeds,
          showFeedModal: this.showFeedModal,
          showListenerModal: this.showListenerModal,
          subscriptions: this.state.subscriptions }))
      )
    );
  }
}

// Feed in the list of feeds
let Feed = props => {
  let { feed } = props;

  return React.createElement(
    'div',
    { style: {
        borderLeft: 'solid 2px ' + primaryBgColor,
        marginLeft: '16px',
        marginTop: '16px',
        padding: '8px'
      } },
    React.createElement(
      'div',
      { style: { display: 'flex' } },
      React.createElement(
        'div',
        { style: { flex: '1' } },
        React.createElement(
          'h2',
          { style: {
              fontWeight: '400'
            } },
          feed.name,
          React.createElement(
            'span',
            { style: { fontSize: '14px' } },
            '\xA0by ',
            feed.creator_name
          )
        ),
        React.createElement(
          'subhead',
          { style: { color: subheaderColor, fontSize: '12px' } },
          React.createElement(
            Overflow,
            null,
            feed.uri
          )
        )
      ),
      $level(PERMISSIONS.EDIT_LISTENER, React.createElement(
        'div',
        { style: { display: 'flex' } },
        React.createElement(IconButton, { icon: 'playlist_add', onClick: props.showListenerModal(true, feed) })
      )),
      $level(PERMISSIONS.EDIT_FEED, React.createElement(
        'div',
        { style: { display: 'flex' } },
        React.createElement(IconButton, { icon: 'create', onClick: props.showFeedModal(false, feed) }),
        React.createElement(IconButton, { icon: 'delete', onClick: e => {
            $confirmModal('Delete Feed', `Are you sure you want to delete feed "${feed.name}"?`).then(() => {
              $.ajax({ method: 'delete', url: '/api/feeds/' + feed.id }).then(props.refresh, $handleError);
            });
          } })
      ))
    ),
    React.createElement(
      'div',
      null,
      $filter(props.listeners, l => l.feed_id == feed.id).map(l => React.createElement(
        'div',
        { style: {
            alignItems: 'center',
            display: 'flex'
          } },
        React.createElement(IconButton, { icon: props.subscriptions[l.id] ? 'star' : 'star_border',
          onClick: e => $.ajax({
            url: 'api/user/listeners' + (props.subscriptions[l.id] ? '/' + l.id : ''),
            method: props.subscriptions[l.id] ? 'delete' : 'post',
            data: { listener_id: l.id }
          }).then(props.refresh, $handleError) }),
        React.createElement(
          'div',
          { style: {
              display: 'flex',
              flexDirection: 'column',
              width: '300px',
              marginLeft: '8px',
              marginTop: '4px'
            } },
          React.createElement(
            Overflow,
            { height: '15px' },
            l.name
          ),
          React.createElement(
            Overflow,
            null,
            React.createElement(
              'span',
              { style: {
                  fontFamily: 'monospace',
                  fontSize: '10px'
                } },
              '/',
              l.pattern,
              '/i'
            )
          )
        ),
        React.createElement(
          'div',
          { style: {
              display: 'flex',
              flexDirection: 'column',
              flex: '1',
              marginLeft: '8px',
              marginTop: '4px'
            } },
          React.createElement(
            'div',
            { style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              } },
            $ago(l.last_update)
          ),
          React.createElement(
            'div',
            { style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                fontSize: '10px'
              } },
            l.subscribers,
            ' Subscribers'
          )
        ),
        $level(PERMISSIONS.EDIT_LISTENER, React.createElement(
          'div',
          { style: { display: 'flex' } },
          React.createElement(IconButton, { icon: 'create', onClick: props.showListenerModal(false, feed, l) }),
          React.createElement(IconButton, { icon: 'delete', onClick: e => {
              $confirmModal('Delete Listener', `Are you sure you want to delete listener "${l.name}"?`).then(() => {
                $.ajax({ method: 'delete', url: '/api/listeners/' + l.id }).then(props.refresh, $handleError);
              });
            } })
        ))
      ))
    )
  );
};

// Emby iframe
let Emby = props => React.createElement('iframe', { style: {
    border: 'none',
    flex: '1'
  },
  src: '/mb/web/index.html',
  allowfullscreen: true });

// Rutorrent iframe
let RuTorrent = props => React.createElement('iframe', { style: {
    border: 'none',
    flex: '1'
  },
  src: '/rutorrent/',
  allowfullscreen: true });

/*
  A colored toolbar
  <Toolbar
    title="string"> // Title of the toolbar
      ...           // Other components in the toolbar
  </Toolbar>
*/
let Toolbar = props => React.createElement(
  'div',
  { style: {
      alignItems: 'center',
      backgroundColor: primaryBgColor,
      color: primaryFgColor,
      display: 'flex',
      flexDirection: 'row',
      height: '48px',
      paddingRight: '20px',
      paddingLeft: '20px'
    } },
  React.createElement(
    'h2',
    { style: {
        cursor: 'pointer',
        fontWeight: '400'
      },
      className: 'toolbar-title',
      onClick: () => location.hash = "#/" },
    props.title
  ),
  props.children
);

/*
  Basic material icon
  <Icon
    style={object}> // Component styling
    icon_label      // Icon label
  </Icon>
*/
let Icon = props => React.createElement(
  'i',
  { className: 'material-icons', style: props.style },
  props.children
);

/*
  Used as a button

  <IconButton
    onClick={fn} // Click handler
    submit       // form submit
    primary      // add primary class
    /> 
*/
let IconButton = props => React.createElement(
  'div',
  { style: { alignItems: 'center', display: 'flex' } },
  React.createElement(
    'button',
    _extends({
      onClick: props.onClick,
      type: $hasProp(props, 'submit') ? 'submit' : null,
      className: 'icon-button' + ($hasProp(props, 'primary') ? ' primary' : '')
    }, props),
    React.createElement(
      Icon,
      null,
      props.icon
    )
  )
);

/*
  <Chip
    onClick={fn}    // chip click function
    icon="icon">    // chip icon
    ...             // chip text
  </Chip>
*/
let Chip = props => React.createElement(
  'div',
  { className: 'chip' + (props.primary ? ' primary' : ''), onClick: props.onClick, style: {
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      height: '32px',
      borderRadius: '16px',
      paddingLeft: '8px',
      paddingRight: '8px'
    } },
  React.createElement(
    'span',
    { style: { flex: '1' } },
    props.children
  ),
  React.createElement(
    Icon,
    { style: { marginLeft: '4px' } },
    props.icon
  )
);

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
      show: false
    };

    this.submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    let result = event.target.field.value;
    event.target.field.value = "";
    this.setState({ show: false });
    if (this.props.onSubmit) this.props.onSubmit(result);
  }

  render() {
    return React.createElement(
      'div',
      { style: {
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row'
        } },
      $if(this.state.show, React.createElement(
        'form',
        { onSubmit: this.submit, style: {
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row'
          } },
        React.createElement(Input, { placeholder: this.props.placeholder, pattern: this.props.pattern, name: 'field' }),
        React.createElement(IconButton, { icon: this.props.icon || "add", submit: true })
      )),
      $if(!this.state.show, React.createElement(IconButton, { icon: this.props.icon || "add", onClick: () => this.setState({ show: true }) }))
    );
  }
}

class PopupButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
    this.open = this.open.bind(this);
  }

  open(event) {
    this.setState({ open: true });
    let { id, title, children } = this.props;
    $(`<div id="${id}"/>`).dialog({
      resizable: false,
      title: title,
      open(e) {
        ReactDOM.render(React.createElement(
          'div',
          null,
          children
        ), $('#' + id)[0]);
      }
    }).on('dialogclose', e => {
      ReactDOM.unmountComponentAtNode($('#' + id)[0]);
      $('#' + id).remove();
      this.setState({ open: false });
    });
  }

  render() {
    return $if(!this.state.open, React.createElement(IconButton, { icon: this.props.icon, primary: true, onClick: this.open }));
  }
}

let Input = props => React.createElement('input', _extends({
  className: 'input ' + (props.className || ''),
  style: {
    margin: $hasProp(props, 'margin') ? '4px' : ''
  }
}, props));

/*
  <Card
    nostretch>          // prevents the card from taking up the entire width
    nostretch="100px">  // changes the given width of the card
    ...
  </Card>
    Basic card container
*/
let Card = props => React.createElement(
  'div',
  { style: {
      backgroundColor: cardBg,
      // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
      margin: '16px',
      flex: '1',
      maxWidth: $hasProp(props, 'nostretch') ? props.nostretch || 'auto' : 'calc(100vw - 32px)'
    } },
  props.children
);

/*
  Padding for layout
    <Padding> ... </Padding>
*/
let Padding = props => React.createElement(
  'div',
  _extends({ style: { padding: '16px' } }, props),
  props.children
);

/*
  Modal Container for a Card
  <Modal
    title="string"    // title of modal
    onClose={fn}>     // on close callback, must hide the modal
    ...               // modal card content
  </Modal>
*/
let Modal = props => React.createElement(
  'div',
  { style: {
      alignItems: 'center',
      display: 'flex',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      left: '0',
      top: '0',
      width: '100vw'
    }, 'data-wall': true, onClick: e => {
      if ($(e.target).attr('data-wall') && props.onClose) props.onClose(e);
    } },
  React.createElement(
    Card,
    { nostretch: '300px', onClick: e => e.preventDefault(), style: { zIndex: '5' } },
    React.createElement(
      CardHeader,
      { title: props.title },
      $if(props.onClose, React.createElement(IconButton, { icon: 'close', onClick: props.onClose }))
    ),
    props.children
  )
);

/*
  Used with <Card/> for a header
  <CardHeader>
    title="string"> // Title of the card
    ...             // ... Things to put on the right
  </CardHeader>
*/
let CardHeader = props => React.createElement(
  'div',
  { style: {
      alignItems: 'center',
      display: 'flex',
      height: '48px',
      paddingLeft: '16px',
      paddingRight: '8px'
    } },
  React.createElement(
    'h2',
    { style: {
        flex: '1',
        fontWeight: 400
      } },
    props.title
  ),
  React.createElement(
    'div',
    { style: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end'
      } },
    props.children
  )
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
let Th = props => React.createElement(
  'th',
  {
    onClick: props.onClick,
    style: {
      cursor: $hasProp(props, 'nosort') ? '' : 'pointer',
      fontSize: '0.8em',
      fontWeight: 400
    } },
  React.createElement(
    'span',
    { style: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center'
      } },
    props.label,
    $if(!$hasProp(props, 'nosort'), React.createElement(
      Icon,
      { style: props.active ? {
          color: subheaderColor,
          transition: 'all 0.5s ease'
        } : {
          color: 'transparent',
          transition: 'all 0.5s ease'
        } },
      props.reverse && props.active ? 'expand_more' : 'expand_less'
    ))
  )
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
let Td = props => React.createElement(
  'td',
  { style: {
      padding: '4px',
      whiteSpace: 'nowrap',
      overflow: $hasProp(props, 'expand') ? 'hidden' : '',
      width: $hasProp(props, 'expand') ? '100%' : 'auto',
      position: 'relative',
      textAlign: $hasProp(props, 'left') ? 'left' : $hasProp(props, 'center') ? 'center' : $hasProp(props, 'right') ? 'right' : '',
      textOverflow: 'elipsis'
    } },
  React.createElement(
    'span',
    { style: {
        transition: 'margin-left 1s ease',
        top: $hasProp(props, 'expand') ? '4px' : '0',
        position: $hasProp(props, 'expand') ? 'absolute' : 'relative'
      }, onMouseOver: e => {
        let width = $(e.target).width();
        let maxWidth = $(e.target).parent().width();
        if (width <= maxWidth) return;
        $(e.target).css({
          marginLeft: '-' + (width - maxWidth) + 'px'
        });
      }, onMouseLeave: e => {
        $(e.target).css({
          marginLeft: '0px'
        });
      } },
    props.children
  )
);

/*
  Overflow autos hides text that overflows
    when a user hovers over the text, it shows the rest

  <Overflow
    height="10px">   // height of component
    ...              // content to overflow
  </Overflow>
*/
let Overflow = props => React.createElement(
  'span',
  { style: {
      display: 'flex',
      height: props.height || '20px',
      overflow: 'hidden',
      position: 'relative',
      textOverflow: 'elipsis',
      whiteSpace: 'nowrap'
    } },
  React.createElement(
    'span',
    { style: {
        transition: 'margin-left 1s ease',
        position: 'absolute'
      }, onMouseOver: e => {
        let width = $(e.target).width();
        let maxWidth = $(e.target).parent().width();
        if (width <= maxWidth) return;
        $(e.target).css({
          marginLeft: '-' + (width - maxWidth) + 'px'
        });
      }, onMouseLeave: e => {
        $(e.target).css({
          marginLeft: '0px'
        });
      } },
    props.children
  )
);

/*
  A neat progress bar
  <Progress
    progress={Number} // progress range 0..100.0
    width={"string"}  // width, default is '80px'
*/
let Progress = props => {
  let percent = props.progress;
  return React.createElement(
    'div',
    { style: {
        backgroundColor: subheaderColor,
        position: 'relative',
        height: '20px',
        width: props.width || '80px'
      } },
    React.createElement(
      'div',
      { style: {
          color: primaryFgColor,
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        } },
      Math.round(percent),
      '%'
    ),
    React.createElement('div', { style: {
        backgroundColor: accentColor,
        height: '100%',
        width: percent + '%'
      } })
  );
};

/*
  A row that allows flexing typically used in headers
  <HeaderRow
    flex>     // Should this component flex
      ...     // Content of the component
  </HeaderRow>
*/
let HeaderRow = props => React.createElement(
  'div',
  { style: {
      alignItems: 'center',
      display: 'flex',
      flex: $hasProp(props, 'flex') ? '1' : '',
      justifyContent: 'center'
    } },
  props.children
);

/*
  A space filler for flex components, Functionally a div
  <Flex/>
*/
let Flex = props => React.createElement(
  'div',
  { style: { flex: 1 } },
  props.children
);

// Finally render our component
ReactDOM.render(React.createElement(Seedbox, null), $('#root')[0]);
