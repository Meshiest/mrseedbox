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

function $bytes(bytes) {
  bytes = ~~bytes;
  if (bytes < 1024) return bytes + ' B';else if (bytes < 1048576) return ~~(bytes / 1024).toFixed(3) + ' KB';else if (bytes < 1073741824) return ~~(bytes / 1048576).toFixed(3) + ' MB';else return ~~(bytes / 1073741824).toFixed(3) + ' GB';
}

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
          React.createElement(IconButton, { primary: true, icon: 'list' }),
          React.createElement(IconButton, { primary: true, icon: 'chat' }),
          React.createElement(IconButton, { primary: true, icon: 'stars' })
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
      React.createElement(User, null),
      React.createElement(Torrents, null)
    );
  }
}

// Renders a welcome message for the user
class User extends React.Component {
  constructor(props) {
    super(props);

    let welcome = 'Welcome';
    let time = new Date();
    let hours = time.getHours(),
        mins = time.getMinutes();

    if (5 <= hours && hours <= 8) welcome = 'Good Morning';

    if (hours > 8 && hours < 12) welcome = 'Top of the Morning';

    if (hours === 12 && mins <= 5) welcome = 'It\'s High Noon';else if (hours >= 12 && hours <= 17) welcome = 'Good Afternoon';

    if (hours > 17 && hours <= 21) welcome = 'Good Evening';

    if (hours > 21 || hours < 5) welcome = 'Good Night';

    this.state = {
      user: {
        name: 'Friend',
        email: 'n/a'
      },
      welcome
    };
  }

  componentDidMount() {
    $.ajax({
      url: '/api/users'
    }).then(users => {
      users.forEach(user => {
        if (user.id === user_id) this.setState({ user });
      });
    });
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
      )
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
    this.getTorrents(true);
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
      this.updateTimeout = setTimeout(() => this.getTorrents(true), 1000);
    }, error => {
      this.setState({ error });
      this.updateTimeout = setTimeout(() => this.getTorrents(true), 10000);
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
              console.log(resp);
              this.getTorrents();
            }, err => console.warn(err));
          } }))
      ),
      React.createElement(
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
            { style: {
                borderBottom: 'thin solid ' + subheaderColor
              } },
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
          null,
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
          $level(PERMISSIONS.EDIT_TORRENT, React.createElement(
            'div',
            { style: {
                display: 'flex',
                backgroundColor: tintColor,
                borderBottom: 'thin solid ' + bgColor
              } },
            React.createElement(
              HeaderRow,
              null,
              React.createElement(IconButton, { icon: torrent.status == 'stopped' ? 'play_arrow' : 'pause', onClick: e => $.ajax({
                  method: 'post',
                  url: `/api/torrents/${torrent.info_hash}/${torrent.status == 'stopped' ? 'start' : 'stop'}`
                }).then(this.props.getTorrents, err => console.warn(err)) })
            ),
            React.createElement(
              HeaderRow,
              { flex: true },
              'Created ',
              torrent.creationDate
            ),
            React.createElement(
              HeaderRow,
              null,
              React.createElement(IconButton, { icon: 'delete', onClick: e => confirm("Are you sure you want to delete " + torrent.name) && $.ajax({
                  method: 'post',
                  url: `/api/torrents/${torrent.info_hash}/delete`
                }).then(this.props.getTorrents, err => console.warn(err)) })
            )
          )),
          torrent.files.map(file => {
            let ratio = file.completedChunks / file.totalChunks;
            let link = encodeURI(file.path).replace(/&/g, '%26').replace(/;/g, '%3B');
            return React.createElement(
              'div',
              { style: {
                  alignItems: 'center',
                  display: 'flex',
                  padding: '4px',
                  paddingLeft: '20px'
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
                file.name
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

let Emby = props => React.createElement('iframe', { style: {
    border: 'none',
    flex: '1'
  },
  src: '/mb/web/index.html',
  allowfullscreen: true });

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
  'button',
  {
    onClick: props.onClick,
    type: $hasProp(props, 'submit') ? 'submit' : null,
    className: $hasProp(props, 'primary') ? 'primary' : '' },
  React.createElement(
    Icon,
    null,
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
        React.createElement('input', { name: 'field',
          type: 'text',
          placeholder: this.props.placeholder,
          style: {
            outline: 'none',
            padding: '8px',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
          } }),
        React.createElement(IconButton, { icon: this.props.icon || "add", submit: true })
      )),
      $if(!this.state.show, React.createElement(IconButton, { icon: this.props.icon || "add", onClick: () => this.setState({ show: true }) }))
    );
  }
}

/*
  <Card> ... </Card>
    Basic card container
*/
let Card = props => React.createElement(
  'div',
  { style: {
      backgroundColor: cardBg,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
      margin: '16px',
      width: 'calc(100vw - 32px)'
    } },
  props.children
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
      paddingRight: '16px'
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
    >
    ...    // Cell contents
  </Td>
*/
let Td = props => React.createElement(
  'td',
  { style: {
      padding: '4px',
      whiteSpace: 'nowrap',
      textOverflow: 'elipsis',
      overflow: 'hidden',
      maxWidth: '500px',
      textAlign: $hasProp(props, 'left') ? 'left' : $hasProp(props, 'center') ? 'center' : $hasProp(props, 'right') ? 'right' : ''
    } },
  React.createElement(
    'span',
    { style: {
        transition: 'margin-left 0.5s ease'
      }, onMouseOver: e => {
        let width = $(e.target).width();
        if (width <= 500) return;
        $(e.target).css({
          marginLeft: '-' + (width - 500) + 'px'
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

ReactDOM.render(React.createElement(Seedbox, null), $('#root')[0]);
