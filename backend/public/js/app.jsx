const { HashRouter, Route, Switch } = ReactRouterDOM;

const teal500 = '#00897B';
const blue100 = '#BBDEFB';
const accentColor = '#039BE5';
const green100 = '#C8E6C9';
const primaryFgColor = '#ffffff';
const cardBg = '#ffffff';
const bgColor = '#eeeeee';
const subheaderColor = '#555555';

const OWNER_LEVEL   = 3
const EDITOR_LEVEL  = 2
const MEMBER_LEVEL  = 1
const VISITOR_LEVEL = 0
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

function $hasProp(props, key) {
  return Object.keys(props).includes(key);
}

function $to(path) {
  return () => location.hash = '#/' + path;
}

function $if(condition, onTrue) {
  return condition ? onTrue : null;
}

function $level(level, elem) {
  return $if(user_level >= level, elem);
}

function $bytes(bytes) {
  bytes = ~~bytes;
  if(bytes < 1024) return bytes + " B";
  else if(bytes < 1048576) return ~~(bytes / 1024).toFixed(3) + " KB";
  else if(bytes < 1073741824) return ~~(bytes / 1048576).toFixed(3) + " MB";
  else return ~~(bytes / 1073741824).toFixed(3) + " GB";
}

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
        <Toolbar>
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

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Torrents/>
      </div>
    );
  }
}

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
    this.getTorrents(true);
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
          t.progress = this.getProgress(t);
          t.download = 0;
          t.total = 0;
          t.files.forEach(f => {
            t.download += f.completedChunks;
            t.total += f.totalChunks;
          });
        });
        this.setState({torrents});
        this.updateTimeout = setTimeout(() => this.getTorrents(true), 1000);
      },
      error => {
        this.setState({error})
        this.updateTimeout = setTimeout(() => this.getTorrents(true), 10000);
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
                  url: '/api/torrents?url=' + result
                }).then(
                  resp => {
                    console.log(resp)
                    this.getTorrents();
                  },
                  err => console.warn(err)
                )
              }}/>
          )}
        </CardHeader>
        <div style={{overflow: 'auto'}}>
          <table style={{
              borderCollapse: 'collapse',
              width: '100%',
            }}>
            <thead style={{
                borderBottom: 'thin solid ' + subheaderColor,
              }}>
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
              <Torrent torrent={torrent} key={torrent.info_hash}/>
            )}
          </table>
        </div>
      </Card>
    );
  }
}

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
            backgroundColor: torrent.status === 'downloading' ? blue100 : green100,
            cursor: 'pointer',
          }}
          onClick={()=>this.setState({expand: !this.state.expand})}>
          <Td>
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
                return <div style={{
                    alignItems: 'center',
                    display: 'flex',
                    padding: '4px',
                    paddingLeft: '20px',
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
                      {file.name}
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

let Emby = props => (
  <iframe style={{
      border: 'none',
      flex: '1',
    }}
    src="/mb/web/index.html"
    allowfullscreen>
  </iframe>
);

let RuTorrent = props => (
  <iframe style={{
      border: 'none',
      flex: '1',
    }}
    src="/rutorrent/"
    allowfullscreen>
  </iframe>
);

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={{
        alignItems: 'center',
        backgroundColor: teal500,
        color: primaryFgColor,
        display: 'flex',
        flexDirection: 'row',
        height: '48px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}>
        <h2 style={{
            cursor: 'pointer',
            fontWeight: '400',
          }}
          onClick={()=>location.hash="#/"}>
          MrSeedbox
        </h2>
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
          <IconButton primary icon="list"></IconButton>
          <IconButton primary icon="chat"></IconButton>
          <IconButton primary icon="stars"></IconButton>
        </HeaderRow>
      </div>
    );
  }
}

let Icon = props => (
  <i className="material-icons" style={props.style}>
    {props.children}
  </i>
);

let IconButton = props => (
  <button
    onClick={props.onClick}
    type={$hasProp(props, 'submit') ? 'submit' : null}
    className={$hasProp(props, 'primary') ? 'primary' : ''}>
    <Icon>{props.icon}</Icon>
  </button>
);

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
          <input name="field"
            type="text"
            placeholder={this.props.placeholder}
            style={{
              outline: 'none',
              padding: '8px',
              border: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
            }}/>
            <IconButton icon="add" submit/>
        </form>
      )}
      {$if(!this.state.show, 
        <IconButton icon="add" onClick={
          () => this.setState({show: true})
        }/>
      )}
    </div>
  }
}

let Card = props => (
  <div style={{
      backgroundColor: cardBg,
      margin: '16px',
    }}>
    {props.children}
  </div>
);

let CardHeader = props => (
  <div style={{
      alignItems: 'center',
      display: 'flex',
      height: '48px',
      paddingLeft: '16px',
      paddingRight: '16px',
    }}>
    <h2 style={{
        flex: '1',
        fontWeight: 400,
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

let Th = props => (
  <th
    onClick={props.onClick}
    style={{
      cursor: 'pointer',
      fontSize: '0.8em',
      fontWeight: 400,
    }}>
    <span style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
      }}>
      {props.label}
      <Icon style={props.active ? {
          color: subheaderColor,
          transition: 'all 0.5s ease',
        } : {
          color: 'transparent',
          transition: 'all 0.5s ease',
        }}>
        { props.reverse && props.active ? 'expand_more' : 'expand_less' }
      </Icon>
    </span>
  </th>
);

let Td = props => (
  <td style={{
      padding: '4px',
      whiteSpace: 'nowrap',
      textOverflow: 'elipsis',
      overflow: 'hidden',
      maxWidth: '500px',
      textAlign: 
        $hasProp(props, 'left') ? 'left' : 
        $hasProp(props, 'center') ? 'center' : 
        $hasProp(props, 'right') ? 'right' : '',
    }}>
    <span style={{
      transition: 'margin-left 0.5s ease'
    }} onMouseOver={e => {
      let width = $(e.target).width();
      if(width <= 500)
        return;
      $(e.target).css({
        marginLeft: '-'+(width-500)+'px',
      })
    }} onMouseLeave={e => {
      $(e.target).css({
        marginLeft: '0px',
      })
    }}>{props.children}</span>
  </td>
);

let Progress = props => {
  let percent = props.progress;
  return (
    <div style={{
        backgroundColor: subheaderColor,
        position: 'relative',
        height: '20px',
        width: '80px',
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

ReactDOM.render(<Seedbox/>, $('#root')[0]);